import { z } from "zod";

export const examBaseSchema = z.object({
  examTitle: z.string().min(3, "Title must be at least 3 characters").max(100),
  examDescription: z.string().max(500).optional(),
  durationInMinutes: z.coerce
    .number()
    .int()
    .positive("Duration must be a positive integer"),
  totalMarks: z.coerce
    .number()
    .int()
    .positive("Total marks must be a positive integer"),
  passingMarks: z.coerce
    .number()
    .int()
    .positive("Passing marks must be a positive integer"),
  examStartDate: z.coerce.date(),
  examEndDate: z.coerce.date(),
  isPublished: z.boolean().default(false),
});

export const createExamSchema = examBaseSchema
  .refine((data) => data.passingMarks <= data.totalMarks, {
    message: "Passing marks cannot exceed total marks",
    path: ["passingMarks"],
  })
  .refine((data) => data.examEndDate > data.examStartDate, {
    message: "Exam end date must be strictly after the start date",
    path: ["examEndDate"],
  });

export const updateExamSchema = examBaseSchema.partial();
export type CreateExamInput = z.infer<typeof createExamSchema>;
export type UpdateExamInput = z.infer<typeof updateExamSchema>;
