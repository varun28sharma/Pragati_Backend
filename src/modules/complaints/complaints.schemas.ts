import { ComplaintCategory, ComplaintStatus } from "@prisma/client";
import { z } from "zod";

export const createComplaintSchema = z.object({
  category: z.nativeEnum(ComplaintCategory),
  description: z.string().trim().min(10).max(1000),
  isAnonymous: z.boolean().optional().default(false)
});

export const updateComplaintSchema = z
  .object({
    status: z.nativeEnum(ComplaintStatus).optional(),
    resolutionNote: z
      .string()
      .trim()
      .min(1, "resolutionNote cannot be empty")
      .max(500)
      .optional()
  })
  .refine((value) => Boolean(value.status) || typeof value.resolutionNote === "string", {
    message: "Provide status or resolutionNote"
  });

export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;
export type UpdateComplaintInput = z.infer<typeof updateComplaintSchema>;
