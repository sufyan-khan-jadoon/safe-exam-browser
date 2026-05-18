import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { prisma } from "../config/database";
import { AppError, asyncHandler } from "./errorHandler";

// Extend Express Request object to include the authenticated teacher
declare global {
  namespace Express {
    interface Request {
      teacher?: any;
    }
  }
}

export const protect = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (req.cookies.jwt) {
    token = req.cookies.jwt;
  } else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new AppError("Not authorized to access this route", 401));
  }

  try {
    const decoded = verifyToken(token);

    const teacher = await prisma.teacher.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        isVerified: true,
      },
    });

    if (!teacher) {
      return next(new AppError("The user belonging to this token no longer exists.", 401));
    }

    req.teacher = teacher;
    next();
  } catch (error) {
    return next(new AppError("Not authorized to access this route", 401));
  }
});
