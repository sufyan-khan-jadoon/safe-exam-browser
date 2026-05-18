import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Server Error";

  // Log error for debugging
  console.error("Error details:", {
    name: err.name,
    message: err.message,
    stack: err.stack,
    code: err.code,
  });

  // Prisma unique constraint violation
  if (err.code === "P2002") {
    statusCode = 400;
    message = "Duplicate field value entered";
  }

  // Zod validation error
  if (err.name === "ZodError") {
    statusCode = 400;
    message = err.errors.map((e: any) => e.message).join(", ");
  }

  res.status(statusCode).json({
    success: false,
    error: message,
  });
};
