import { z } from "zod";

export const createUserSchema = z
  .object({
    schoolId: z.coerce.bigint().optional(),
    email: z.string().email(),
    phoneNumber: z.string().regex(/^\+?[0-9]{7,15}$/).optional(),
    password: z.string().min(8),
    role: z.enum(["STUDENT", "TEACHER", "GOVERNMENT", "ADMIN"]),
    studentId: z.coerce.bigint().optional(),
    teacherId: z.coerce.bigint().optional()
  })
  .refine(
    (data) => {
      if (data.role === "STUDENT") {
        return Boolean(data.studentId);
      }
      if (data.role === "TEACHER") {
        return Boolean(data.teacherId);
      }
      return true;
    },
    {
      message: "studentId is required for STUDENT role and teacherId is required for TEACHER role"
    }
  );

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const updateUserStatusSchema = z.object({
  status: z.enum(["active", "blocked"])
});
