import { Request, Response } from "express";
import { prisma } from "../config/database";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { createExamSchema, updateExamSchema } from "../validators/exam.validator";
import { generateExamKey } from "../utils/generateKey";

// @desc    Create a new exam
// @route   POST /api/exams
// @access  Private
export const createExam = asyncHandler(async (req: Request, res: Response) => {
  const teacherId = req.teacher.id;
  const validatedData = createExamSchema.parse(req.body);

  // Generate unique exam key with collision protection
  let examKey = "";
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    examKey = generateExamKey();
    const existing = await prisma.exam.findUnique({ where: { examKey } });
    if (!existing) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    throw new AppError("Could not generate a unique exam key. Please try again.", 500);
  }

  const exam = await prisma.exam.create({
    data: {
      ...validatedData,
      examKey,
      teacherId,
    },
  });

  res.status(201).json({ success: true, data: exam });
});

// @desc    Get all exams for logged-in teacher
// @route   GET /api/exams
// @access  Private
export const getExams = asyncHandler(async (req: Request, res: Response) => {
  const teacherId = req.teacher.id;

  const exams = await prisma.exam.findMany({
    where: { teacherId },
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json({ success: true, data: exams });
});

// @desc    Get a single exam by ID
// @route   GET /api/exams/:id
// @access  Private
export const getExamById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const teacherId = req.teacher.id;

  const exam = await prisma.exam.findFirst({
    where: { id, teacherId },
  });

  if (!exam) {
    throw new AppError("Exam not found or you are not authorized to view it", 404);
  }

  res.status(200).json({ success: true, data: exam });
});

// @desc    Update an exam
// @route   PUT /api/exams/:id
// @access  Private
export const updateExam = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const teacherId = req.teacher.id;

  const exam = await prisma.exam.findFirst({
    where: { id, teacherId },
  });

  if (!exam) {
    throw new AppError("Exam not found or you are not authorized to edit it", 404);
  }

  const validatedData = updateExamSchema.parse(req.body);

  const updatedExam = await prisma.exam.update({
    where: { id },
    data: validatedData,
  });

  res.status(200).json({ success: true, data: updatedExam });
});

// @desc    Delete an exam
// @route   DELETE /api/exams/:id
// @access  Private
export const deleteExam = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const teacherId = req.teacher.id;

  const exam = await prisma.exam.findFirst({
    where: { id, teacherId },
  });

  if (!exam) {
    throw new AppError("Exam not found or you are not authorized to delete it", 404);
  }

  await prisma.exam.delete({
    where: { id },
  });

  res.status(200).json({ success: true, message: "Exam deleted successfully" });
});
