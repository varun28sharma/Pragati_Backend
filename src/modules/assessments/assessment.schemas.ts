import { z } from "zod";

export const createExamSchema = z.object({
  subjectId: z.coerce.bigint(),
  teacherId: z.coerce.bigint(),
  classroomId: z.coerce.bigint().optional(),
  name: z.string().min(2),
  totalMarks: z.number().positive(),
  examDate: z.coerce.date()
});

export const recordExamResultsSchema = z.object({
  examId: z.coerce.bigint(),
  results: z
    .array(
      z.object({
        studentId: z.coerce.bigint(),
        score: z.number().min(0),
        grade: z.string().min(1)
      })
    )
    .min(1)
});
