import jwt from "jsonwebtoken";
import { env } from "../config/env";

export const generateToken = (id: string): string => {
  return jwt.sign({ id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
};

export const verifyToken = (token: string): { id: string } => {
  return jwt.verify(token, env.JWT_SECRET) as { id: string };
};

export const generateStudentToken = (studentId: string, examId: string, sessionId: string): string => {
  return jwt.sign({ studentId, examId, sessionId }, env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

export const verifyStudentToken = (token: string): { studentId: string; examId: string; sessionId: string } => {
  return jwt.verify(token, env.JWT_SECRET) as { studentId: string; examId: string; sessionId: string };
};
