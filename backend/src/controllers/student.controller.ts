import { Request, Response } from "express";
import { prisma } from "../config/database";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { joinExamSchema } from "../validators/student.validator";
import { generateStudentToken } from "../utils/jwt";

// @desc    Join an exam as a student & start/resume session
// @route   POST /api/student/join
// @access  Public
export const joinExam = asyncHandler(async (req: Request, res: Response) => {
  const { fullName, rollNumber, examKey } = joinExamSchema.parse(req.body);

  // 1. Find the exam
  const exam = await prisma.exam.findUnique({
    where: { examKey },
  });

  if (!exam) {
    throw new AppError("Invalid Exam Key. Please check and try again.", 404);
  }

  // 2. Verify exam is published and active
  if (!exam.isPublished) {
    throw new AppError("This exam has not been published yet.", 400);
  }

  const now = new Date();
  if (now < new Date(exam.examStartDate)) {
    throw new AppError(`This exam is scheduled to start at ${new Date(exam.examStartDate).toLocaleString()}`, 400);
  }

  if (now > new Date(exam.examEndDate)) {
    throw new AppError("This exam has already ended.", 400);
  }

  // 3. Find or create Student
  let student = await prisma.student.findUnique({
    where: { rollNumber },
  });

  if (!student) {
    student = await prisma.student.create({
      data: {
        fullName,
        rollNumber,
      },
    });
  } else if (student.fullName !== fullName) {
    student = await prisma.student.update({
      where: { rollNumber },
      data: { fullName },
    });
  }

  // 4. Check for existing ExamSession
  let session = await prisma.examSession.findFirst({
    where: {
      studentId: student.id,
      examId: exam.id,
    },
  });

  if (session) {
    if (session.status === "COMPLETED") {
      throw new AppError("You have already completed and submitted this exam.", 400);
    }
  } else {
    // 5. Create new session if none exists
    session = await prisma.examSession.create({
      data: {
        studentId: student.id,
        examId: exam.id,
        status: "STARTED",
        startedAt: now,
      },
    });
  }

  // 6. Generate student session token
  const studentToken = generateStudentToken(student.id, exam.id, session.id);

  // 7. Set as secure cookie
  res.cookie("student_jwt", studentToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });

  res.status(200).json({
    success: true,
    data: {
      student,
      session,
      exam: {
        id: exam.id,
        examTitle: exam.examTitle,
        durationInMinutes: exam.durationInMinutes,
      },
      token: studentToken,
    },
  });
});

// @desc    Get active exam questions (correctAnswers hidden)
// @route   GET /api/student/exam
// @access  Private (Student Session)
export const getStudentExam = asyncHandler(async (req: Request, res: Response) => {
  const examId = req.examId;
  const sessionId = req.sessionId;

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    select: {
      id: true,
      examTitle: true,
      examDescription: true,
      durationInMinutes: true,
      totalMarks: true,
      examStartDate: true,
      examEndDate: true,
    },
  });

  if (!exam) {
    throw new AppError("Exam details not found.", 404);
  }

  // Fetch questions without showing correctAnswer
  const questions = await prisma.question.findMany({
    where: { examId },
    select: {
      id: true,
      questionText: true,
      questionType: true,
      options: true,
      points: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Fetch already saved answers for this session (for resuming progress)
  const savedAnswers = await prisma.studentAnswer.findMany({
    where: { sessionId },
    select: {
      questionId: true,
      answerText: true,
    },
  });

  res.status(200).json({
    success: true,
    data: {
      exam,
      questions,
      savedAnswers,
    },
  });
});

// @desc    Save/Update answer for a question
// @route   POST /api/student/answers
// @access  Private (Student Session)
export const saveAnswer = asyncHandler(async (req: Request, res: Response) => {
  const sessionId = req.sessionId;
  const { questionId, answerText } = req.body;

  if (!questionId || answerText === undefined) {
    throw new AppError("Question ID and answer text are required.", 400);
  }

  // Find the question to get correct answer for auto-grading
  const question = await prisma.question.findUnique({
    where: { id: questionId },
  });

  if (!question) {
    throw new AppError("Question not found.", 404);
  }

  // Auto-grade logic
  let isCorrect = false;
  if (question.questionType === "MCQ" || question.questionType === "TRUE_FALSE") {
    isCorrect = question.correctAnswer === answerText;
  } else if (question.questionType === "SHORT_ANSWER") {
    // Simple case-insensitive matching
    isCorrect = question.correctAnswer.trim().toLowerCase() === answerText.trim().toLowerCase();
  }

  // Upsert the answer
  const existingAnswer = await prisma.studentAnswer.findFirst({
    where: { sessionId, questionId },
  });

  let savedAnswer;
  if (existingAnswer) {
    savedAnswer = await prisma.studentAnswer.update({
      where: { id: existingAnswer.id },
      data: { answerText, isCorrect },
    });
  } else {
    savedAnswer = await prisma.studentAnswer.create({
      data: {
        sessionId: sessionId!,
        questionId,
        answerText,
        isCorrect,
      },
    });
  }

  res.status(200).json({ success: true, data: savedAnswer });
});

// @desc    Submit exam and calculate score
// @route   POST /api/student/submit
// @access  Private (Student Session)
export const submitExam = asyncHandler(async (req: Request, res: Response) => {
  const sessionId = req.sessionId;

  // 1. Get all questions and answers for this session
  const session = await prisma.examSession.findUnique({
    where: { id: sessionId },
    include: {
      exam: {
        include: {
          questions: true,
        },
      },
    },
  });

  if (!session) {
    throw new AppError("Session not found.", 404);
  }

  if (session.status === "COMPLETED") {
    throw new AppError("Exam is already submitted.", 400);
  }

  const studentAnswers = await prisma.studentAnswer.findMany({
    where: { sessionId },
  });

  // Calculate score
  let obtainedMarks = 0;
  studentAnswers.forEach((ans) => {
    if (ans.isCorrect) {
      const q = session.exam.questions.find((q) => q.id === ans.questionId);
      if (q) {
        obtainedMarks += q.points;
      }
    }
  });

  // Update session status
  const updatedSession = await prisma.examSession.update({
    where: { id: sessionId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      obtainedMarks,
    },
  });

  // Clear student session cookie
  res.clearCookie("student_jwt");

  res.status(200).json({
    success: true,
    message: "Exam submitted successfully.",
    data: {
      obtainedMarks,
      totalMarks: session.exam.totalMarks,
    },
  });
});
