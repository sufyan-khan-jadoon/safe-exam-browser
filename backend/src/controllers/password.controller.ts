import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../config/database";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { sendPasswordResetEmail } from "../utils/email";
import { generateRandomToken } from "../utils/crypto";
import { z } from "zod";

const forgotSchema = z.object({ email: z.string().email() });
const resetSchema = z.object({ password: z.string().min(8) });

// @desc    Forgot password
// @route   POST /api/password/forgot
// @access  Public
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = forgotSchema.parse(req.body);

  const teacher = await prisma.teacher.findUnique({ where: { email } });
  if (!teacher) {
    throw new AppError("There is no user with that email address", 404);
  }

  // Generate token and expiry (15 mins)
  const resetToken = generateRandomToken();
  const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.teacher.update({
    where: { id: teacher.id },
    data: { resetToken, resetTokenExpiry },
  });

  try {
    await sendPasswordResetEmail(teacher.email, resetToken);
    res.status(200).json({ success: true, message: "Token sent to email" });
  } catch (error) {
    await prisma.teacher.update({
      where: { id: teacher.id },
      data: { resetToken: null, resetTokenExpiry: null },
    });
    throw new AppError("There was an error sending the email. Try again later!", 500);
  }
});

// @desc    Reset password
// @route   POST /api/password/reset/:token
// @access  Public
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params;
  const { password } = resetSchema.parse(req.body);

  const teacher = await prisma.teacher.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: { gt: new Date() },
    },
  });

  if (!teacher) {
    throw new AppError("Token is invalid or has expired", 400);
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  await prisma.teacher.update({
    where: { id: teacher.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  res.status(200).json({ success: true, message: "Password updated successfully" });
});
