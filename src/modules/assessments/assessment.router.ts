import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { validateBody } from "../../middleware/validateResource";
import { asyncHandler } from "../../utils/asyncHandler";
import { createExamSchema, recordExamResultsSchema } from "./assessment.schemas";

export const assessmentRouter = Router();

assessmentRouter.post(
  "/exams",
  validateBody(createExamSchema),
  asyncHandler(async (req, res) => {
    const exam = await prisma.exam.create({ data: req.body });
    res.status(201).json(exam);
  })
);

assessmentRouter.post(
  "/exam-results",
  validateBody(recordExamResultsSchema),
  asyncHandler(async (req, res) => {
    const { examId, results } = req.body;

    await prisma.$transaction(async (tx) => {
      for (const result of results) {
        await tx.studentExamResult.upsert({
          where: {
            examId_studentId: {
              examId,
              studentId: result.studentId
            }
          },
          create: {
            examId,
            studentId: result.studentId,
            score: result.score,
            grade: result.grade
          },
          update: {
            score: result.score,
            grade: result.grade,
            gradedAt: new Date()
          }
        });
      }
    });

    res.json({ message: "Exam results synced" });
  })
);

assessmentRouter.get(
  "/students/:studentId/latest",
  asyncHandler(async (req, res) => {
    const studentId = BigInt(req.params.studentId);

    const results = await prisma.studentExamResult.findMany({
      where: { studentId },
      include: {
        exam: true
      },
      orderBy: { gradedAt: "desc" },
      take: 10
    });

    res.json(results);
  })
);
