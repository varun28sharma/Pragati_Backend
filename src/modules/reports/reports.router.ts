import { Router } from "express";
import { authorizeRoles } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { buildPdfBuffer } from "../../utils/pdf";
import { buildPrincipalAttendanceReport, buildTeacherAttendanceReport, DateRange } from "./reports.service";

export const reportsRouter = Router();

const normalizeRange = (startStr: string | undefined, endStr: string | undefined) => {
  if (!startStr || !endStr) {
    throw new Error("start and end query params are required (ISO date strings)");
  }
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Invalid start or end date");
  }
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  if (start > end) {
    throw new Error("start date must be before end date");
  }
  return { start, end } satisfies DateRange;
};

const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`;

const formatRange = (range: DateRange) => `${range.start.toISOString().slice(0, 10)} → ${range.end
  .toISOString()
  .slice(0, 10)}`;

reportsRouter.get(
  "/attendance/principal",
  authorizeRoles("ADMIN", "GOVERNMENT", "PRINCIPAL"),
  asyncHandler(async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const schoolId = req.user.schoolId ?? req.user.teacher?.schoolId;
    if (!schoolId) {
      return res.status(400).json({ message: "School scope is required" });
    }

    let range: DateRange;
    try {
      range = normalizeRange(req.query.start as string | undefined, req.query.end as string | undefined);
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }

    const report = await buildPrincipalAttendanceReport({ schoolId, range });
    res.json(report);
  })
);

reportsRouter.get(
  "/attendance/principal/pdf",
  authorizeRoles("ADMIN", "GOVERNMENT", "PRINCIPAL"),
  asyncHandler(async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const schoolId = req.user.schoolId ?? req.user.teacher?.schoolId;
    if (!schoolId) {
      return res.status(400).json({ message: "School scope is required" });
    }

    let range: DateRange;
    try {
      range = normalizeRange(req.query.start as string | undefined, req.query.end as string | undefined);
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }

    const report = await buildPrincipalAttendanceReport({ schoolId, range });
    const summarySection = {
      title: "Summary",
      lines: [
        `School ID: ${report.schoolId}`,
        `Range: ${formatRange(report.range)}`,
        `Sessions counted: ${report.totals.sessions}`,
        `Overall attendance rate: ${formatPercent(report.totals.attendanceRate)}`
      ]
    };
    const stringifyClassroom = (entry: (typeof report.classrooms)[number]) => {
      const labelParts = [entry.grade?.name, entry.section?.label].filter(Boolean).join("-");
      const label = labelParts ? ` (${labelParts})` : "";
      return `${entry.classroomId.toString()}${label}`;
    };

    const topSection = {
      title: "Top Classrooms",
      lines:
        report.topClassrooms.length > 0
          ? report.topClassrooms.map(
              (entry, index) =>
                `${index + 1}. ${stringifyClassroom(entry)} — ${formatPercent(entry.attendanceRate)} over ${
                  entry.totalRecords
                } records`
            )
          : ["No classroom data in this range"]
    };

    const bottomSection = {
      title: "Lowest Attendance Classrooms",
      lines:
        report.bottomClassrooms.length > 0
          ? report.bottomClassrooms.map(
              (entry, index) =>
                `${index + 1}. ${stringifyClassroom(entry)} — ${formatPercent(entry.attendanceRate)} over ${
                  entry.totalRecords
                } records`
            )
          : ["No classroom data in this range"]
    };

    const buffer = await buildPdfBuffer(`Attendance Report - School ${report.schoolId}`, [
      summarySection,
      topSection,
      bottomSection
    ]);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="attendance-principal-${report.schoolId}.pdf"`);
    res.send(buffer);
  })
);

reportsRouter.get(
  "/attendance/teacher",
  authorizeRoles("TEACHER"),
  asyncHandler(async (req, res) => {
    if (!req.user?.teacherId || !req.user.teacher) {
      return res.status(403).json({ message: "Teacher profile missing" });
    }
    const schoolId = req.user.teacher.schoolId;

    let range: DateRange;
    try {
      range = normalizeRange(req.query.start as string | undefined, req.query.end as string | undefined);
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }

    let classroomFilter: bigint | undefined;
    if (req.query.classroomId) {
      try {
        classroomFilter = BigInt(req.query.classroomId as string);
      } catch {
        return res.status(400).json({ message: "Invalid classroomId" });
      }
    }

    try {
      const report = await buildTeacherAttendanceReport({
        teacherId: req.user.teacherId,
        schoolId,
        range,
        classroomFilter
      });
      res.json(report);
    } catch (error) {
      if ((error as Error).message === "Classroom is not assigned to teacher") {
        return res.status(403).json({ message: (error as Error).message });
      }
      throw error;
    }
  })
);

reportsRouter.get(
  "/attendance/teacher/pdf",
  authorizeRoles("TEACHER"),
  asyncHandler(async (req, res) => {
    if (!req.user?.teacherId || !req.user.teacher) {
      return res.status(403).json({ message: "Teacher profile missing" });
    }
    const schoolId = req.user.teacher.schoolId;

    let range: DateRange;
    try {
      range = normalizeRange(req.query.start as string | undefined, req.query.end as string | undefined);
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }

    let classroomFilter: bigint | undefined;
    if (req.query.classroomId) {
      try {
        classroomFilter = BigInt(req.query.classroomId as string);
      } catch {
        return res.status(400).json({ message: "Invalid classroomId" });
      }
    }

    let report;
    try {
      report = await buildTeacherAttendanceReport({
        teacherId: req.user.teacherId,
        schoolId,
        range,
        classroomFilter
      });
    } catch (error) {
      if ((error as Error).message === "Classroom is not assigned to teacher") {
        return res.status(403).json({ message: (error as Error).message });
      }
      throw error;
    }

    const baseSection = {
      title: "Teacher Summary",
      lines: [
        `Teacher ID: ${report.teacherId?.toString()}`,
        `School ID: ${report.schoolId.toString()}`,
        `Range: ${formatRange(report.range)}`,
        `Classrooms included: ${report.classrooms.length}`
      ]
    };

    const classroomSections = report.classrooms.map((classroom) => {
      const roles: string[] = [];
      if (classroom.roles?.homeroom) {
        roles.push("Homeroom");
      }
      if (classroom.roles?.subjects.length) {
        roles.push(`Subjects: ${classroom.roles.subjects.map((s) => s.subjectCode).join(", ")}`);
      }
      const descriptorParts = [classroom.grade?.name, classroom.section?.label].filter(Boolean).join(" ");
      return {
        title: `Classroom ${classroom.classroomId.toString()}${descriptorParts ? ` (${descriptorParts})` : ""}`,
        lines: [
          roles.length ? `Roles: ${roles.join(" | ")}` : "Roles: Subject support",
          `Sessions counted: ${classroom.totalSessions}`,
          `Attendance rate: ${formatPercent(classroom.attendanceRate)}`,
          `Trend points: ${classroom.trend?.length ?? 0}`
        ]
      };
    });

    const buffer = await buildPdfBuffer(`Teacher Attendance Report - ${report.teacherId?.toString()}`, [
      baseSection,
      ...classroomSections
    ]);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="attendance-teacher-${report.teacherId?.toString() ?? "me"}.pdf"`
    );
    res.send(buffer);
  })
);