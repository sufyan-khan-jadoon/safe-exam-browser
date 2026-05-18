import { z } from "zod";

const QuestionTypeEnum = z.enum(["MCQ", "TRUE_FALSE", "SHORT_ANSWER"]);

export const createQuestionSchema = z
  .object({
    questionText: z.string().min(3, "Question text must be at least 3 characters").max(1000),
    questionType: QuestionTypeEnum,
    options: z.array(z.string().min(1, "Option cannot be empty")).default([]),
    correctAnswer: z.string().min(1, "Correct answer is required"),
    points: z.coerce.number().int().positive("Points must be a positive integer").default(1),
  })
  .refine(
    (data) => {
      if (data.questionType === "MCQ") {
        return data.options.length >= 2;
      }
      return true;
    },
    {
      message: "Multiple choice questions must have at least 2 options",
      path: ["options"],
    }
  )
  .refine(
    (data) => {
      if (data.questionType === "MCQ") {
        return data.options.includes(data.correctAnswer);
      }
      return true;
    },
    {
      message: "Correct answer must match one of the provided options",
      path: ["correctAnswer"],
    }
  )
  .refine(
    (data) => {
      if (data.questionType === "TRUE_FALSE") {
        return data.correctAnswer === "true" || data.correctAnswer === "false";
      }
      return true;
    },
    {
      message: "True/False questions must have 'true' or 'false' as the correct answer",
      path: ["correctAnswer"],
    }
  );

export const updateQuestionSchema = createQuestionSchema.partial();
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
