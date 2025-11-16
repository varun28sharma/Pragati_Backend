import { Router } from "express";
import {
  createClassroomSchema,
  createGradeSchema,
  createSchoolSchema,
  createSectionSchema,
  createStudentSchema,
  createSubjectSchema,
  createTeacherSchema
} from "./core.schemas";
import { validateBody } from "../../middleware/validateResource";
import { asyncHandler } from "../../utils/asyncHandler";
import { prisma } from "../../lib/prisma";

export const coreRouter = Router();

coreRouter.post(
  "/schools",
  validateBody(createSchoolSchema),
  asyncHandler(async (req, res) => {
    const school = await prisma.school.create({ data: req.body });
    res.status(201).json(school);
  })
);

coreRouter.get(
  "/schools",
  asyncHandler(async (_req, res) => {
    const schools = await prisma.school.findMany();
    res.json(schools);
  })
);

coreRouter.post(
  "/grades",
  validateBody(createGradeSchema),
  asyncHandler(async (req, res) => {
    const grade = await prisma.grade.create({ data: req.body });
    res.status(201).json(grade);
  })
);

coreRouter.post(
  "/sections",
  validateBody(createSectionSchema),
  asyncHandler(async (req, res) => {
    const section = await prisma.section.create({ data: req.body });
    res.status(201).json(section);
  })
);

coreRouter.post(
  "/classrooms",
  validateBody(createClassroomSchema),
  asyncHandler(async (req, res) => {
    const classroom = await prisma.classroom.create({ data: req.body });
    res.status(201).json(classroom);
  })
);

coreRouter.post(
  "/teachers",
  validateBody(createTeacherSchema),
  asyncHandler(async (req, res) => {
    const teacher = await prisma.teacher.create({ data: req.body });
    res.status(201).json(teacher);
  })
);

coreRouter.post(
  "/subjects",
  validateBody(createSubjectSchema),
  asyncHandler(async (req, res) => {
    const subject = await prisma.subject.create({ data: req.body });
    res.status(201).json(subject);
  })
);

coreRouter.post(
  "/students",
  validateBody(createStudentSchema),
  asyncHandler(async (req, res) => {
    const student = await prisma.student.create({ data: req.body });
    res.status(201).json(student);
  })
);

coreRouter.get(
  "/students/:id",
  asyncHandler(async (req, res) => {
    const student = await prisma.student.findUnique({
      where: { id: BigInt(req.params.id) },
      include: { subjects: true, attendances: true }
    });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json(student);
  })
);
