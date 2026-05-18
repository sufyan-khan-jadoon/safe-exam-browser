import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { protectStudent } from "../middleware/studentAuth.middleware";
import { logViolation, getExamSessions } from "../controllers/proctor.controller";

const router = Router();

// Student-facing violation logger (protected by student token)
router.post("/student/violation", protectStudent, logViolation);

// Teacher-facing live sessions and proctoring logs feed (protected by teacher token)
router.get("/exams/:examId/sessions", protect, getExamSessions);

export default router;
