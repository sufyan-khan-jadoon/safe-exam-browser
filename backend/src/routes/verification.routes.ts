import { Router } from "express";
import { verifyEmail } from "../controllers/verification.controller";

const router = Router();

router.post("/verify/:token", verifyEmail);

export default router;
