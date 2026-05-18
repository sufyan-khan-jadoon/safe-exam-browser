import { Request, Response } from "express";
import { prisma } from "../config/database";
import { asyncHandler, AppError } from "../middleware/errorHandler";

// @desc    Verify email address
// @route   POST /api/verification/verify/:token
// @access  Public
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params;

  const teacher = await prisma.teacher.findFirst({
    where: {
      verificationToken: token,
      verificationTokenExpiry: {
        gt: new Date(), // Check if expiry is greater than current time
      },
    },
  });

  if (!teacher) {
    throw new AppError("Invalid or expired verification token", 400);
  }

  // Update teacher
  await prisma.teacher.update({
    where: { id: teacher.id },
    data: {
      isVerified: true,
      verificationToken: null,
      verificationTokenExpiry: null,
    },
  });

  res.status(200).json({ success: true, message: "Email verified successfully" });
});
