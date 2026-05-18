import { Router } from "express";
import { forgotPassword, resetPassword } from "../controllers/password.controller";

const router = Router();

router.post("/forgot", forgotPassword);
router.post("/reset/:token", resetPassword);

export default router;
