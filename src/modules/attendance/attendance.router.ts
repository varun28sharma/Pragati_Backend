import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { validateBody } from "../../middleware/validateResource";
import { asyncHandler } from "../../utils/asyncHandler";
import { createAttendanceSessionSchema, recordAttendanceSchema } from "./attendance.schemas";

const toDate = (value?: string) => (value ? new Date(value) : undefined);

export const attendanceRouter = Router();

attendanceRouter.post(
  "/sessions",
  validateBody(createAttendanceSessionSchema),
  asyncHandler(async (req, res) => {
    const { startsAt, endsAt, ...rest } = req.body;
    const session = await prisma.attendanceSession.create({
      data: {
        ...rest,
        startsAt: toDate(startsAt),
        endsAt: toDate(endsAt)
      }
    });
    res.status(201).json(session);
  })
);

attendanceRouter.post(
  "/sessions/:sessionId/records",
  validateBody(recordAttendanceSchema),
  asyncHandler(async (req, res) => {
    const attendanceSessionId = BigInt(req.params.sessionId);
    const payload = recordAttendanceSchema.parse(req.body);

    await prisma.$transaction(async (tx) => {
      for (const entry of payload.entries) {
        await tx.studentAttendance.upsert({
          where: {
            attendanceSessionId_studentId: {
              attendanceSessionId,
              studentId: entry.studentId
            }
          },
          create: {
            attendanceSessionId,
            studentId: entry.studentId,
            status: entry.status
          },
          update: {
            status: entry.status
          }
        });
      }
    });

    res.json({ message: "Attendance synced" });
  })
);

attendanceRouter.get(
  "/students/:studentId",
  asyncHandler(async (req, res) => {
    const studentId = BigInt(req.params.studentId);
    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;

    const attendances = await prisma.studentAttendance.findMany({
      where: {
        studentId,
        attendanceSession: {
          sessionDate: {
            gte: from,
            lte: to
          }
        }
      },
      include: {
        attendanceSession: true
      },
      orderBy: [{ attendanceSession: { sessionDate: "desc" } }]
    });

    res.json(attendances);
  })
);
