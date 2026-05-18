import { z } from "zod";

export const joinExamSchema = z.object({
  fullName: z.string().min(3, "Full Name must be at least 3 characters").max(100),
  rollNumber: z.string().min(3, "Roll Number must be at least 3 characters").max(50),
  examKey: z
    .string()
    .length(6, "Exam Key must be exactly 6 characters")
    .toUpperCase(),
});

export type JoinExamInput = z.infer<typeof joinExamSchema>;
