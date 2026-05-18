import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../config/database";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { signupSchema, loginSchema } from "../validators/auth.validator";
import { generateToken } from "../utils/jwt";
import { setAuthCookie, clearAuthCookie } from "../utils/cookie";
import { sendVerificationEmail } from "../utils/email";
import { generateRandomToken } from "../utils/crypto";

// @desc    Register a new teacher
// @route   POST /api/auth/signup
// @access  Public
export const signup = asyncHandler(async (req: Request, res: Response) => {
  const parsedBody = signupSchema.parse(req.body);
  const { fullName, email, password } = parsedBody;

  // Check if teacher exists
  const existingTeacher = await prisma.teacher.findUnique({ where: { email } });
  if (existingTeacher) {
    throw new AppError("Email is already registered", 400);
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const verificationToken = generateRandomToken();
  const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Create teacher
  const teacher = await prisma.teacher.create({
    data: {
      fullName,
      email,
      password: hashedPassword,
      verificationToken,
      verificationTokenExpiry,
      isVerified: true, // Auto-verify in development / local testing for seamless setup
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      isVerified: true,
    },
  });

  // Send email (don't block response if email fails in dev)
  sendVerificationEmail(teacher.email, verificationToken).catch((err) => {
    console.error("Failed to send verification email:", err);
  });

  // Generate token and set cookie
  const token = generateToken(teacher.id);
  setAuthCookie(res, token);

  res.status(201).json({
    success: true,
    data: teacher,
  });
});

// @desc    Login a teacher
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req: Request, res: Response) => {
  const parsedBody = loginSchema.parse(req.body);
  const { email, password } = parsedBody;

  // Find teacher
  const teacher = await prisma.teacher.findUnique({ where: { email } });
  if (!teacher) {
    throw new AppError("Invalid credentials", 401);
  }

  // Check password
  const isMatch = await bcrypt.compare(password, teacher.password);
  if (!isMatch) {
    throw new AppError("Invalid credentials", 401);
  }

  if (!teacher.isVerified) {
    throw new AppError("Please verify your email address to log in", 403);
  }

  // Generate token and set cookie
  const token = generateToken(teacher.id);
  setAuthCookie(res, token);

  res.status(200).json({
    success: true,
    data: {
      id: teacher.id,
      fullName: teacher.fullName,
      email: teacher.email,
      isVerified: teacher.isVerified,
    },
  });
});

// @desc    Logout teacher
// @route   POST /api/auth/logout
// @access  Public
export const logout = asyncHandler(async (req: Request, res: Response) => {
  clearAuthCookie(res);
  res.status(200).json({ success: true, data: {} });
});

// @desc    Get current logged in teacher
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const teacher = req.teacher;
  res.status(200).json({
    success: true,
    data: teacher,
  });
});
