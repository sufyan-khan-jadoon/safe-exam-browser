import { Request, Response } from "express";
import { prisma } from "../config/database";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { createQuestionSchema, updateQuestionSchema } from "../validators/question.validator";

// @desc    Create a new question for an exam
// @route   POST /api/exams/:examId/questions
// @access  Private
export const createQuestion = asyncHandler(async (req: Request, res: Response) => {
  const { examId } = req.params;
  const teacherId = req.teacher.id;

  // Verify the exam exists and belongs to this teacher
  const exam = await prisma.exam.findFirst({
    where: { id: examId, teacherId },
  });

  if (!exam) {
    throw new AppError("Exam not found or you are not authorized to add questions to it", 404);
  }

  const validatedData = createQuestionSchema.parse(req.body);

  const question = await prisma.question.create({
    data: {
      ...validatedData,
      examId,
    },
  });

  res.status(201).json({ success: true, data: question });
});

// @desc    Get all questions for an exam
// @route   GET /api/exams/:examId/questions
// @access  Private
export const getQuestionsForExam = asyncHandler(async (req: Request, res: Response) => {
  const { examId } = req.params;
  const teacherId = req.teacher.id;

  // Verify the exam exists and belongs to this teacher
  const exam = await prisma.exam.findFirst({
    where: { id: examId, teacherId },
  });

  if (!exam) {
    throw new AppError("Exam not found or you are not authorized to view its questions", 404);
  }

  const questions = await prisma.question.findMany({
    where: { examId },
    orderBy: { createdAt: "asc" },
  });

  res.status(200).json({ success: true, data: questions });
});

// @desc    Update a question
// @route   PUT /api/questions/:id
// @access  Private
export const updateQuestion = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const teacherId = req.teacher.id;

  // Verify the question belongs to an exam created by this teacher
  const question = await prisma.question.findUnique({
    where: { id },
    include: { exam: true },
  });

  if (!question || question.exam.teacherId !== teacherId) {
    throw new AppError("Question not found or you are not authorized to edit it", 404);
  }

  const validatedData = updateQuestionSchema.parse(req.body);

  const updatedQuestion = await prisma.question.update({
    where: { id },
    data: validatedData,
  });

  res.status(200).json({ success: true, data: updatedQuestion });
});

// @desc    Delete a question
// @route   DELETE /api/questions/:id
// @access  Private
export const deleteQuestion = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const teacherId = req.teacher.id;

  // Verify the question belongs to an exam created by this teacher
  const question = await prisma.question.findUnique({
    where: { id },
    include: { exam: true },
  });

  if (!question || question.exam.teacherId !== teacherId) {
    throw new AppError("Question not found or you are not authorized to delete it", 404);
  }

  await prisma.question.delete({
    where: { id },
  });

  res.status(200).json({ success: true, message: "Question deleted successfully" });
});
