import { ComplaintCategory, ComplaintStatus, Prisma, UserRole } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { authorizeRoles } from "../../middleware/auth";
import { validateBody } from "../../middleware/validateResource";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  CreateComplaintInput,
  UpdateComplaintInput,
  createComplaintSchema,
  updateComplaintSchema
} from "./complaints.schemas";

const complaintsRouter = Router();

const complaintSelect = {
  id: true,
  schoolId: true,
  category: true,
  description: true,
  status: true,
  isAnonymous: true,
  classroomId: true,
  studentId: true,
  createdAt: true,
  updatedAt: true,
  resolutionNote: true,
  resolvedAt: true,
  student: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      code: true
    }
  },
  classroom: {
    select: {
      id: true,
      grade: { select: { id: true, name: true, level: true } },
      section: { select: { id: true, label: true } }
    }
  },
  resolvedBy: {
    select: {
      id: true,
      role: true,
      email: true
    }
  }
} as const;

interface ComplaintPayload {
  id: bigint;
  schoolId: bigint;
  category: ComplaintCategory;
  description: string;
  status: ComplaintStatus;
  isAnonymous: boolean;
  classroomId: bigint | null;
  studentId: bigint | null;
  createdAt: Date;
  updatedAt: Date;
  resolutionNote: string | null;
  resolvedAt: Date | null;
  student: {
    id: bigint;
    firstName: string;
    lastName: string;
    code: string;
  } | null;
  classroom: {
    id: bigint;
    grade: { id: bigint; name: string; level: number } | null;
    section: { id: bigint; label: string } | null;
  } | null;
  resolvedBy: {
    id: bigint;
    role: UserRole;
    email: string;
  } | null;
}

const formatClassroom = (classroom: ComplaintPayload["classroom"]) => {
  if (!classroom) {
    return null;
  }
  return {
    id: classroom.id,
    grade: classroom.grade
      ? {
          id: classroom.grade.id,
          name: classroom.grade.name,
          level: classroom.grade.level
        }
      : null,
    section: classroom.section
      ? {
          id: classroom.section.id,
          label: classroom.section.label
        }
      : null
  };
};

const serializeComplaint = (complaint: ComplaintPayload, opts: { includeStudent: boolean }) => {
  const base = {
    id: complaint.id,
    schoolId: complaint.schoolId,
    category: complaint.category,
    description: complaint.description,
    status: complaint.status,
    isAnonymous: complaint.isAnonymous,
    classroomId: complaint.classroomId,
    createdAt: complaint.createdAt,
    updatedAt: complaint.updatedAt,
    resolutionNote: complaint.resolutionNote ?? null,
    resolvedAt: complaint.resolvedAt ?? null,
    classroom: formatClassroom(complaint.classroom),
    resolvedBy: complaint.resolvedBy
      ? {
          id: complaint.resolvedBy.id,
          role: complaint.resolvedBy.role,
          email: complaint.resolvedBy.email
        }
      : null
  };

  return {
    ...base,
    student:
      opts.includeStudent && complaint.student
        ? {
            id: complaint.student.id,
            firstName: complaint.student.firstName,
            lastName: complaint.student.lastName,
            code: complaint.student.code
          }
        : null
  };
};

const parseBoolean = (value?: string) => {
  if (value === undefined) {
    return undefined;
  }
  if (["true", "1"].includes(value.toLowerCase())) {
    return true;
  }
  if (["false", "0"].includes(value.toLowerCase())) {
    return false;
  }
  throw new Error("Invalid boolean value");
};

const ensureCategory = (value?: string): ComplaintCategory | undefined => {
  if (!value) {
    return undefined;
  }
  const normalized = value.toLowerCase() as ComplaintCategory;
  if ((Object.values(ComplaintCategory) as string[]).includes(normalized)) {
    return normalized;
  }
  throw new Error("Invalid complaint category");
};

const ensureStatus = (value?: string): ComplaintStatus | undefined => {
  if (!value) {
    return undefined;
  }
  const normalized = value.toLowerCase() as ComplaintStatus;
  if ((Object.values(ComplaintStatus) as string[]).includes(normalized)) {
    return normalized;
  }
  throw new Error("Invalid complaint status");
};

complaintsRouter.post(
  "/",
  authorizeRoles("STUDENT"),
  validateBody(createComplaintSchema),
  asyncHandler(async (req, res) => {
    const payload = req.body as CreateComplaintInput;

    if (!req.user?.student || !req.user.studentId) {
      return res.status(403).json({ message: "Student profile missing" });
    }

    const complaint = await prisma.complaint.create({
      data: {
        schoolId: req.user.student.schoolId,
        studentId: payload.isAnonymous ? null : req.user.studentId,
        classroomId: req.user.student.classroomId,
        reportedById: req.user.id,
        category: payload.category,
        description: payload.description,
        isAnonymous: payload.isAnonymous ?? false
      },
      select: complaintSelect
    });

    res.status(201).json(serializeComplaint(complaint, { includeStudent: true }));
  })
);

complaintsRouter.get(
  "/mine",
  authorizeRoles("STUDENT"),
  asyncHandler(async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const where: Prisma.ComplaintWhereInput = {
      reportedById: req.user.id
    };

    let statusFilter: ComplaintStatus | undefined;
    try {
      statusFilter = ensureStatus(req.query.status as string | undefined);
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
    if (statusFilter) {
      where.status = statusFilter;
    }

    const complaints = await prisma.complaint.findMany({
      where,
      select: complaintSelect,
      orderBy: { createdAt: "desc" }
    });

    res.json({
      total: complaints.length,
      items: complaints.map((entry) => serializeComplaint(entry, { includeStudent: true }))
    });
  })
);

complaintsRouter.get(
  "/",
  authorizeRoles("PRINCIPAL", "ADMIN"),
  asyncHandler(async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let schoolId: bigint | undefined;
    if (req.user.role === "PRINCIPAL") {
      if (!req.user.schoolId) {
        return res.status(400).json({ message: "Principal account is missing school assignment" });
      }
      schoolId = req.user.schoolId;
    } else {
      if (!req.query.schoolId) {
        return res.status(400).json({ message: "schoolId query parameter is required for admins" });
      }
      try {
        schoolId = BigInt(req.query.schoolId as string);
      } catch {
        return res.status(400).json({ message: "Invalid schoolId" });
      }
    }

    const where: Prisma.ComplaintWhereInput = {
      schoolId
    };

    let statusFilter: ComplaintStatus | undefined;
    try {
      statusFilter = ensureStatus(req.query.status as string | undefined);
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
    if (statusFilter) {
      where.status = statusFilter;
    }

    let categoryFilter: ComplaintCategory | undefined;
    try {
      categoryFilter = ensureCategory(req.query.category as string | undefined);
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
    if (categoryFilter) {
      where.category = categoryFilter;
    }

    let anonymousFlag: boolean | undefined;
    try {
      anonymousFlag = parseBoolean(req.query.anonymous as string | undefined);
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
    if (anonymousFlag !== undefined) {
      where.isAnonymous = anonymousFlag;
    }
    if (req.query.studentId) {
      try {
        where.studentId = BigInt(req.query.studentId as string);
      } catch {
        return res.status(400).json({ message: "Invalid studentId" });
      }
    }

    const complaints = await prisma.complaint.findMany({
      where,
      select: complaintSelect,
      orderBy: { createdAt: "desc" }
    });

    res.json({
      schoolId,
      total: complaints.length,
      items: complaints.map((entry) => serializeComplaint(entry, { includeStudent: !entry.isAnonymous }))
    });
  })
);

complaintsRouter.patch(
  "/:complaintId",
  authorizeRoles("PRINCIPAL", "ADMIN"),
  validateBody(updateComplaintSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let complaintId: bigint;
    try {
      complaintId = BigInt(req.params.complaintId);
    } catch {
      return res.status(400).json({ message: "Invalid complaint id" });
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      select: { id: true, schoolId: true }
    });

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    if (req.user.role === "PRINCIPAL") {
      if (!req.user.schoolId || req.user.schoolId !== complaint.schoolId) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    const payload = req.body as UpdateComplaintInput;

    const updateData: Prisma.ComplaintUpdateInput = {};
    if (payload.status) {
      updateData.status = payload.status;
      if (payload.status === "resolved" || payload.status === "dismissed") {
        updateData.resolvedBy = { connect: { id: req.user.id } };
        updateData.resolvedAt = new Date();
      } else {
        updateData.resolvedBy = { disconnect: true };
        updateData.resolvedAt = null;
      }
    }
    if (payload.resolutionNote) {
      updateData.resolutionNote = payload.resolutionNote;
    }

    const updated = await prisma.complaint.update({
      where: { id: complaintId },
      data: updateData,
      select: complaintSelect
    });

    res.json(serializeComplaint(updated, { includeStudent: !updated.isAnonymous }));
  })
);

export { complaintsRouter };
