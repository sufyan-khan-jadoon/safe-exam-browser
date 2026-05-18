import { Router } from "express";
import { protectStudent } from "../middleware/studentAuth.middleware";
import {
  joinExam,
  getStudentExam,
  saveAnswer,
  submitExam,
} from "../controllers/student.controller";

const router = Router();

// Public joining route
router.post("/student/join", joinExam);

// Protected active exam routes
router.get("/student/exam", protectStudent, getStudentExam);
router.post("/student/answers", protectStudent, saveAnswer);
router.post("/student/submit", protectStudent, submitExam);

export default router;
