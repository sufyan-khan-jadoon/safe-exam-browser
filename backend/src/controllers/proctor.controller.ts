import { Request, Response } from "express";
import { prisma } from "../config/database";
import { asyncHandler, AppError } from "../middleware/errorHandler";

// @desc    Log a security violation during an exam
// @route   POST /api/student/violation
// @access  Private (Student Session)
export const logViolation = asyncHandler(async (req: Request, res: Response) => {
  const sessionId = req.sessionId;
  const { type, description } = req.body;

  if (!type) {
    throw new AppError("Violation type is required.", 400);
  }

  const log = await prisma.cheatLog.create({
    data: {
      sessionId: sessionId!,
      type,
      description: description || null,
    },
  });

  res.status(201).json({ success: true, data: log });
});

// @desc    Get all student exam sessions & cheat logs for an exam (Proctoring)
// @route   GET /api/exams/:examId/sessions
// @access  Private (Teacher)
export const getExamSessions = asyncHandler(async (req: Request, res: Response) => {
  const { examId } = req.params;
  const teacherId = req.teacher.id;

  // 1. Verify exam ownership
  const exam = await prisma.exam.findFirst({
    where: { id: examId, teacherId },
  });

  if (!exam) {
    throw new AppError("Exam not found or you are not authorized to view its sessions", 404);
  }

  // 2. Fetch all sessions with students and logs
  const sessions = await prisma.examSession.findMany({
    where: { examId },
    include: {
      student: {
        select: {
          id: true,
          fullName: true,
          rollNumber: true,
        },
      },
      cheatLogs: {
        orderBy: { timestamp: "desc" },
      },
      _count: {
        select: { answers: true },
      },
    },
    orderBy: { startedAt: "desc" },
  });

  res.status(200).json({ success: true, data: sessions });
});
