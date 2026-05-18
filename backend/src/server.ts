import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import hpp from "hpp";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { prisma } from "./config/database";
import authRoutes from "./routes/auth.routes";
import verificationRoutes from "./routes/verification.routes";
import passwordRoutes from "./routes/password.routes";
import examRoutes from "./routes/exam.routes";
import questionRoutes from "./routes/question.routes";
import studentRoutes from "./routes/student.routes";
import proctorRoutes from "./routes/proctor.routes";

const app = express();

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);
app.use(hpp());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  limit: 100, // Limit each IP to 100 requests per window
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
app.use("/api", limiter);

// Body parsing & logging
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Health Check (Trigger Reload)
app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "ok", database: "connected" });
  } catch (error) {
    res.status(500).json({ status: "error", database: "disconnected" });
  }
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/password", passwordRoutes);
app.use("/api/exams", examRoutes);
app.use("/api", questionRoutes); // Mounts /api/exams/... and /api/questions/...
app.use("/api", studentRoutes); // Mounts student endpoints under /api/...
app.use("/api", proctorRoutes); // Mounts proctoring endpoints under /api/...

// Error Handler
app.use(errorHandler);

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running in ${env.NODE_ENV} mode on port ${PORT}`);
  });
}

export default app;




