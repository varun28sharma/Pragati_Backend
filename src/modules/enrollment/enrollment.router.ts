import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { validateBody } from "../../middleware/validateResource";
import { asyncHandler } from "../../utils/asyncHandler";
import { authorizeRoles } from "../../middleware/auth";
import {
  addGroupMembersSchema,
  createStudentGroupSchema,
  createStudentSubjectSchema,
  createTeacherSubjectSchema
} from "./enrollment.schemas";

export const enrollmentRouter = Router();

enrollmentRouter.post(
  "/teacher-subjects",
  authorizeRoles("ADMIN", "GOVERNMENT", "TEACHER"),
  validateBody(createTeacherSubjectSchema),
  asyncHandler(async (req, res) => {
    if (req.user?.role === "TEACHER" && req.user.teacherId !== req.body.teacherId) {
      return res.status(403).json({ message: "Teachers can only manage their own subjects" });
    }
    const record = await prisma.teacherSubject.create({ data: req.body });
    res.status(201).json(record);
  })
);

enrollmentRouter.post(
  "/student-subjects",
  authorizeRoles("ADMIN", "GOVERNMENT", "TEACHER"),
  validateBody(createStudentSubjectSchema),
  asyncHandler(async (req, res) => {
    if (req.user?.role === "TEACHER") {
      const teacherSubject = await prisma.teacherSubject.findUnique({
        where: { id: req.body.teacherSubjectId },
        select: { teacherId: true }
      });
      if (!teacherSubject || teacherSubject.teacherId !== req.user.teacherId) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }
    const record = await prisma.studentSubject.create({ data: req.body });
    res.status(201).json(record);
  })
);

enrollmentRouter.post(
  "/student-groups",
  authorizeRoles("ADMIN", "GOVERNMENT", "TEACHER"),
  validateBody(createStudentGroupSchema),
  asyncHandler(async (req, res) => {
    if (req.user?.role === "TEACHER" && req.user.teacher && req.user.teacher.schoolId !== req.body.schoolId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const group = await prisma.studentGroup.create({ data: req.body });
    res.status(201).json(group);
  })
);

enrollmentRouter.post(
  "/student-groups/:groupId/members",
  authorizeRoles("ADMIN", "GOVERNMENT", "TEACHER"),
  validateBody(addGroupMembersSchema),
  asyncHandler(async (req, res) => {
    const groupId = BigInt(req.params.groupId);
    if (req.user?.role === "TEACHER" && req.user.teacher) {
      const group = await prisma.studentGroup.findUnique({ where: { id: groupId }, select: { schoolId: true } });
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      if (group.schoolId !== req.user.teacher.schoolId) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }
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

enrollmentRouter.get(
  "/student-groups",
  authorizeRoles("ADMIN", "GOVERNMENT", "TEACHER"),
  asyncHandler(async (req, res) => {
    const teacherSchoolId = req.user?.role === "TEACHER" && req.user.teacher ? req.user.teacher.schoolId : undefined;
    const schoolId = teacherSchoolId ?? (req.query.schoolId ? BigInt(String(req.query.schoolId)) : undefined);
    const groups = await prisma.studentGroup.findMany({
      where: schoolId ? { schoolId } : undefined,
      include: { members: true }
    });
    res.json(groups);
  })
);
