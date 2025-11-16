import { z } from "zod";

export const createTeacherSubjectSchema = z.object({
  teacherId: z.coerce.bigint(),
  subjectId: z.coerce.bigint(),
  classroomId: z.coerce.bigint().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional()
});

export const createStudentSubjectSchema = z.object({
  studentId: z.coerce.bigint(),
  teacherSubjectId: z.coerce.bigint(),
  enrolledOn: z.coerce.date(),
  status: z.enum(["active", "dropped", "completed"]).default("active")
});

export const createStudentGroupSchema = z.object({
  schoolId: z.coerce.bigint(),
  name: z.string().min(2),
  description: z.string().optional(),
  visibility: z.enum(["manual", "rule_based"]).default("manual")
});

export const addGroupMembersSchema = z.object({
  studentIds: z.array(z.coerce.bigint()).min(1),
  addedBy: z.coerce.bigint().optional()
});
