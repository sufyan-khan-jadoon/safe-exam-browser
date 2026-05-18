import { Request, Response, NextFunction } from "express";
import { verifyStudentToken } from "../utils/jwt";
import { prisma } from "../config/database";
import { AppError, asyncHandler } from "./errorHandler";

// Extend Request type
declare global {
  namespace Express {
    interface Request {
      student?: { id: string };
      examId?: string;
      sessionId?: string;
    }
  }
}

export const protectStudent = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (req.cookies.student_jwt) {
    token = req.cookies.student_jwt;
  } else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new AppError("Access denied. No student session token found.", 401));
  }

  try {
    const decoded = verifyStudentToken(token);

    // Verify session still exists and is active
    const session = await prisma.examSession.findUnique({
      where: { id: decoded.sessionId },
    });

    if (!session) {
      return next(new AppError("Active exam session not found.", 401));
    }

    if (session.status === "COMPLETED") {
      return next(new AppError("This exam session has already been completed.", 403));
    }

    req.student = { id: decoded.studentId };
    req.examId = decoded.examId;
    req.sessionId = decoded.sessionId;

    next();
  } catch (error) {
    return next(new AppError("Invalid or expired exam session token.", 401));
  }
});
