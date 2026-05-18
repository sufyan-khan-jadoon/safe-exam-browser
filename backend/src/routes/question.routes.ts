import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import {
  createQuestion,
  getQuestionsForExam,
  updateQuestion,
  deleteQuestion,
} from "../controllers/question.controller";

const router = Router();

// Protect all routes
router.use(protect);

// Exam-specific question routes
router.route("/exams/:examId/questions")
  .post(createQuestion)
  .get(getQuestionsForExam);

// Question-specific CRUD routes
router.route("/questions/:id")
  .put(updateQuestion)
  .delete(deleteQuestion);

export default router;
