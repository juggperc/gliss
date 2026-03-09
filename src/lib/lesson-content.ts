import { z } from "zod";

export const flashcardSchema = z.object({
  front: z.string().min(1),
  back: z.string().min(1),
  context: z.string().min(1).optional(),
});

export const quizSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string().min(1)).min(2).max(6),
  correctIndex: z.number().int().min(0),
  explanation: z.string().min(1).optional(),
}).superRefine((value, ctx) => {
  if (value.correctIndex >= value.options.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "correctIndex must reference an option",
      path: ["correctIndex"],
    });
  }
});

export const testQuestionSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string().min(1)).min(2).max(6),
  correctIndex: z.number().int().min(0),
}).superRefine((value, ctx) => {
  if (value.correctIndex >= value.options.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "correctIndex must reference an option",
      path: ["correctIndex"],
    });
  }
});

export const testSchema = z.object({
  title: z.string().min(1),
  questions: z.array(testQuestionSchema).min(1).max(10),
});

export type FlashcardData = z.infer<typeof flashcardSchema>;
export type QuizData = z.infer<typeof quizSchema>;
export type TestData = z.infer<typeof testSchema>;

export function parseFlashcardData(value: unknown): FlashcardData | null {
  const parsed = flashcardSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function parseQuizData(value: unknown): QuizData | null {
  const parsed = quizSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function parseTestData(value: unknown): TestData | null {
  const parsed = testSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function getLessonTitle(type: "flashcard" | "quiz" | "test", value: FlashcardData | QuizData | TestData): string {
  if (type === "flashcard") {
    return (value as FlashcardData).front;
  }

  if (type === "quiz") {
    return (value as QuizData).question;
  }

  return (value as TestData).title;
}

export function getLessonSummary(type: "flashcard" | "quiz" | "test", value: FlashcardData | QuizData | TestData): string {
  if (type === "flashcard") {
    return (value as FlashcardData).back;
  }

  if (type === "quiz") {
    return `${(value as QuizData).options.length} options`;
  }

  return `${(value as TestData).questions.length} questions`;
}
