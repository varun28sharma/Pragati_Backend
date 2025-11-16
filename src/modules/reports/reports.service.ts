import { prisma } from "../../lib/prisma";

export type AttendanceStatusKey = "present" | "absent" | "late" | "excused";

interface AttendanceCounters {
  totalRecords: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
}

const freshCounters = (): AttendanceCounters => ({
  totalRecords: 0,
  present: 0,
  absent: 0,
  late: 0,
  excused: 0
});

const tallyStatus = (counters: AttendanceCounters, status: AttendanceStatusKey) => {
  counters.totalRecords += 1;
  counters[status] += 1;
};

const computeRate = (present: number, total: number) => (total ? Number((present / total).toFixed(4)) : 0);

export interface DateRange {
  start: Date;
  end: Date;
}

interface ClassroomAccumulator extends AttendanceCounters {
  classroomId: bigint;
  totalSessions: number;
  grade?: { id: bigint; name: string; level: number } | null;
  section?: { id: bigint; label: string } | null;
  trend?: Array<{
    date: Date;
    present: number;
    absent: number;
    late: number;
    excused: number;
    attendanceRate: number;
  }>;
  roles?: {
    homeroom: boolean;
    subjects: Array<{ subjectId: bigint; subjectCode: string; subjectName: string }>;
  };
}

const ensureAccumulator = (
  map: Map<bigint, ClassroomAccumulator>,
  classroomId: bigint,
  withTrend = false
) => {
  if (!map.has(classroomId)) {
    map.set(classroomId, {
      classroomId,
      totalSessions: 0,
      ...freshCounters(),
      ...(withTrend ? { trend: [] } : {})
    });
  }
  return map.get(classroomId)!;
};

const attachClassroomMeta = async (map: Map<bigint, ClassroomAccumulator>) => {
  const classroomIds = Array.from(map.keys());
  if (!classroomIds.length) {
    return;
  }
  const classrooms = await prisma.classroom.findMany({
    where: { id: { in: classroomIds } },
    select: {
      id: true,
      grade: { select: { id: true, name: true, level: true } },
      section: { select: { id: true, label: true } }
    }
  });
  const meta = new Map(classrooms.map((room) => [room.id, room]));
  for (const classroomId of classroomIds) {
    const record = map.get(classroomId);
    const detail = meta.get(classroomId);
    if (record && detail) {
      record.grade = detail.grade;
      record.section = detail.section;
    }
  }
};

const summarizeAccumulator = (acc: ClassroomAccumulator) => ({
  classroomId: acc.classroomId,
  grade: acc.grade ?? null,
  section: acc.section ?? null,
  totalSessions: acc.totalSessions,
  totalRecords: acc.totalRecords,
  present: acc.present,
  absent: acc.absent,
  late: acc.late,
  excused: acc.excused,
  attendanceRate: computeRate(acc.present, acc.totalRecords),
  trend: acc.trend ?? [],
  roles: acc.roles ?? { homeroom: false, subjects: [] }
});

export const buildPrincipalAttendanceReport = async (params: {
  schoolId: bigint;
  range: DateRange;
}) => {
  const { schoolId, range } = params;
  const sessions = await prisma.attendanceSession.findMany({
    where: {
      schoolId,
      sessionDate: {
        gte: range.start,
        lte: range.end
      }
    },
    select: {
      id: true,
      classroomId: true,
      sessionDate: true,
      studentAttendance: { select: { status: true } }
    },
    orderBy: { sessionDate: "asc" }
  });

  const classroomMap = new Map<bigint, ClassroomAccumulator>();
  const totalCounters = freshCounters();
  const totalSessions = sessions.length;

  for (const session of sessions) {
    const acc = ensureAccumulator(classroomMap, session.classroomId);
    acc.totalSessions += 1;

    for (const record of session.studentAttendance) {
      tallyStatus(acc, record.status as AttendanceStatusKey);
      tallyStatus(totalCounters, record.status as AttendanceStatusKey);
    }
  }

  await attachClassroomMeta(classroomMap);
  const classrooms = Array.from(classroomMap.values()).map(summarizeAccumulator);
  const ordered = [...classrooms].sort((a, b) => b.attendanceRate - a.attendanceRate);
  const bottomOrdered = [...ordered].reverse();

  return {
    schoolId,
    range,
    totals: {
      sessions: totalSessions,
      totalRecords: totalCounters.totalRecords,
      present: totalCounters.present,
      absent: totalCounters.absent,
      late: totalCounters.late,
      excused: totalCounters.excused,
      attendanceRate: computeRate(totalCounters.present, totalCounters.totalRecords)
    },
    classrooms,
    topClassrooms: ordered.slice(0, 5),
    bottomClassrooms: bottomOrdered.slice(0, 5),
    generatedAt: new Date()
  };
};

const buildTeacherClassroomMap = async (teacherId: bigint, schoolId: bigint) => {
  const map = new Map<bigint, ClassroomAccumulator>();

  const homerooms = await prisma.classroom.findMany({
    where: {
      schoolId,
      students: { some: { classTeacherId: teacherId } }
    },
    include: { grade: true, section: true }
  });

  for (const room of homerooms) {
    const acc = ensureAccumulator(map, room.id, true);
    acc.grade = room.grade;
    acc.section = room.section;
    acc.roles = acc.roles ?? { homeroom: false, subjects: [] };
    acc.roles.homeroom = true;
  }

  const assignments = await prisma.teacherSubject.findMany({
    where: {
      teacherId,
      classroomId: { not: null },
      classroom: { schoolId }
    },
    include: {
      classroom: { include: { grade: true, section: true } },
      subject: { select: { id: true, code: true, name: true } }
    }
  });

  for (const assignment of assignments) {
    if (!assignment.classroomId || !assignment.classroom) {
      continue;
    }
    const acc = ensureAccumulator(map, assignment.classroomId, true);
    acc.grade = assignment.classroom.grade;
    acc.section = assignment.classroom.section;
    acc.roles = acc.roles ?? { homeroom: false, subjects: [] };
    acc.roles.subjects.push({
      subjectId: assignment.subject.id,
      subjectCode: assignment.subject.code,
      subjectName: assignment.subject.name
    });
  }

  return map;
};

export const buildTeacherAttendanceReport = async (params: {
  teacherId: bigint;
  schoolId: bigint;
  range: DateRange;
  classroomFilter?: bigint;
}) => {
  const { teacherId, schoolId, range, classroomFilter } = params;
  const classroomMap = await buildTeacherClassroomMap(teacherId, schoolId);

  const classroomIds = Array.from(classroomMap.keys());
  if (!classroomIds.length) {
    return {
      teacherId,
      schoolId,
      range,
      classrooms: [],
      generatedAt: new Date()
    };
  }

  const targetIds = classroomFilter ? classroomIds.filter((id) => id === classroomFilter) : classroomIds;
  if (!targetIds.length) {
    throw new Error("Classroom is not assigned to teacher");
  }

  const sessions = await prisma.attendanceSession.findMany({
    where: {
      classroomId: { in: targetIds },
      sessionDate: {
        gte: range.start,
        lte: range.end
      }
    },
    select: {
      id: true,
      classroomId: true,
      sessionDate: true,
      studentAttendance: { select: { status: true } }
    },
    orderBy: { sessionDate: "asc" }
  });

  for (const session of sessions) {
    const acc = classroomMap.get(session.classroomId);
    if (!acc || !acc.trend) {
      continue;
    }
    acc.totalSessions += 1;
    const sessionCounters = freshCounters();
    for (const record of session.studentAttendance) {
      tallyStatus(acc, record.status as AttendanceStatusKey);
      tallyStatus(sessionCounters, record.status as AttendanceStatusKey);
    }
    acc.trend.push({
      date: session.sessionDate,
      present: sessionCounters.present,
      absent: sessionCounters.absent,
      late: sessionCounters.late,
      excused: sessionCounters.excused,
      attendanceRate: computeRate(sessionCounters.present, sessionCounters.totalRecords)
    });
  }

  const classrooms = targetIds.map((id) => classroomMap.get(id)!).map(summarizeAccumulator);
  return {
    teacherId,
    schoolId,
    range,
    classrooms,
    generatedAt: new Date()
  };
};
