import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { validateBody } from "../../middleware/validateResource";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  addGroupMembersSchema,
  createStudentGroupSchema,
  createStudentSubjectSchema,
  createTeacherSubjectSchema
} from "./enrollment.schemas";

export const enrollmentRouter = Router();

enrollmentRouter.post(
  "/teacher-subjects",
  validateBody(createTeacherSubjectSchema),
  asyncHandler(async (req, res) => {
    const record = await prisma.teacherSubject.create({ data: req.body });
    res.status(201).json(record);
  })
);

enrollmentRouter.post(
  "/student-subjects",
  validateBody(createStudentSubjectSchema),
  asyncHandler(async (req, res) => {
    const record = await prisma.studentSubject.create({ data: req.body });
    res.status(201).json(record);
  })
);

enrollmentRouter.post(
  "/student-groups",
  validateBody(createStudentGroupSchema),
  asyncHandler(async (req, res) => {
    const group = await prisma.studentGroup.create({ data: req.body });
    res.status(201).json(group);
  })
);

enrollmentRouter.post(
  "/student-groups/:groupId/members",
  validateBody(addGroupMembersSchema),
  asyncHandler(async (req, res) => {
    const groupId = BigInt(req.params.groupId);
    const payload = addGroupMembersSchema.parse(req.body);

    await prisma.$transaction(async (tx) => {
      for (const studentId of payload.studentIds) {
        await tx.studentGroupMember.upsert({
          where: {
            groupId_studentId: {
              groupId,
              studentId
            }
          },
          create: {
            groupId,
            studentId,
            addedBy: payload.addedBy
          },
          update: {}
        });
      }
    });

    res.json({ message: "Members synced" });
  })
);
