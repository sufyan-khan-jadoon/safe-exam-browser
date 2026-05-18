import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import {
  createExam,
  getExams,
  getExamById,
  updateExam,
  deleteExam,
} from "../controllers/exam.controller";

const router = Router();

// Protect all routes under this namespace
router.use(protect);

router.route("/")
  .post(createExam)
  .get(getExams);

router.route("/:id")
  .get(getExamById)
  .put(updateExam)
  .delete(deleteExam);

export default router;
