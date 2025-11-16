CREATE TABLE `School` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `district` VARCHAR(120) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Grade` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `schoolId` BIGINT NOT NULL,
    `name` VARCHAR(30) NOT NULL,
    `level` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    INDEX `Grade_schoolId_idx`(`schoolId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Section` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `gradeId` BIGINT NOT NULL,
    `label` VARCHAR(10) NOT NULL,

    INDEX `Section_gradeId_idx`(`gradeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Classroom` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `schoolId` BIGINT NOT NULL,
    `gradeId` BIGINT NOT NULL,
    `sectionId` BIGINT NOT NULL,
    `academicYear` CHAR(9) NOT NULL,

    INDEX `Classroom_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `Classroom_gradeId_sectionId_academicYear_key`(`gradeId`, `sectionId`, `academicYear`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Student` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `schoolId` BIGINT NOT NULL,
    `classroomId` BIGINT NOT NULL,
    `code` VARCHAR(30) NOT NULL,
    `firstName` VARCHAR(60) NOT NULL,
    `lastName` VARCHAR(60) NOT NULL,
    `gradeLevel` INTEGER NOT NULL,
    `sectionLabel` VARCHAR(10) NOT NULL,
    `enrolledAt` DATE NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,

    INDEX `Student_schoolId_classroomId_idx`(`schoolId`, `classroomId`),
    UNIQUE INDEX `Student_schoolId_code_key`(`schoolId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Teacher` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `schoolId` BIGINT NOT NULL,
    `firstName` VARCHAR(60) NOT NULL,
    `lastName` VARCHAR(60) NOT NULL,
    `email` VARCHAR(120) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Teacher_email_key`(`email`),
    INDEX `Teacher_schoolId_idx`(`schoolId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Subject` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `schoolId` BIGINT NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `name` VARCHAR(80) NOT NULL,

    UNIQUE INDEX `Subject_schoolId_code_key`(`schoolId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `TeacherSubject` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `teacherId` BIGINT NOT NULL,
    `subjectId` BIGINT NOT NULL,
    `classroomId` BIGINT NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NULL,

    UNIQUE INDEX `TeacherSubject_teacherId_subjectId_classroomId_startDate_key`(`teacherId`, `subjectId`, `classroomId`, `startDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `StudentSubject` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `studentId` BIGINT NOT NULL,
    `teacherSubjectId` BIGINT NOT NULL,
    `enrolledOn` DATE NOT NULL,
    `status` ENUM('active', 'dropped', 'completed') NOT NULL DEFAULT 'active',

    UNIQUE INDEX `StudentSubject_studentId_teacherSubjectId_key`(`studentId`, `teacherSubjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Exam` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `subjectId` BIGINT NOT NULL,
    `teacherId` BIGINT NOT NULL,
    `classroomId` BIGINT NULL,
    `name` VARCHAR(80) NOT NULL,
    `totalMarks` DECIMAL(5, 2) NOT NULL,
    `examDate` DATE NOT NULL,

    INDEX `Exam_subjectId_examDate_idx`(`subjectId`, `examDate`),
    INDEX `Exam_classroomId_examDate_idx`(`classroomId`, `examDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `StudentExamResult` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `examId` BIGINT NOT NULL,
    `studentId` BIGINT NOT NULL,
    `score` DECIMAL(5, 2) NOT NULL,
    `grade` VARCHAR(5) NOT NULL,
    `gradedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `StudentExamResult_examId_studentId_key`(`examId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AttendanceSession` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `schoolId` BIGINT NOT NULL,
    `classroomId` BIGINT NOT NULL,
    `subjectId` BIGINT NULL,
    `sessionDate` DATE NOT NULL,
    `startsAt` TIME(0) NULL,
    `endsAt` TIME(0) NULL,

    INDEX `AttendanceSession_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `AttendanceSession_classroomId_subjectId_sessionDate_startsAt_key`(`classroomId`, `subjectId`, `sessionDate`, `startsAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `StudentAttendance` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `attendanceSessionId` BIGINT NOT NULL,
    `studentId` BIGINT NOT NULL,
    `status` ENUM('present', 'absent', 'late', 'excused') NOT NULL DEFAULT 'present',
    `recordedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `StudentAttendance_attendanceSessionId_studentId_key`(`attendanceSessionId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `StudentGroup` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `schoolId` BIGINT NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `description` VARCHAR(191) NULL,
    `visibility` ENUM('manual', 'rule_based') NOT NULL DEFAULT 'manual',
    `active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `StudentGroup_schoolId_name_key`(`schoolId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `StudentGroupMember` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `groupId` BIGINT NOT NULL,
    `studentId` BIGINT NOT NULL,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `addedBy` BIGINT NULL,

    UNIQUE INDEX `StudentGroupMember_groupId_studentId_key`(`groupId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Notification` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `schoolId` BIGINT NOT NULL,
    `title` VARCHAR(120) NOT NULL,
    `body` TEXT NOT NULL,
    `category` ENUM('general', 'exam', 'attendance', 'emergency') NOT NULL DEFAULT 'general',
    `activeFrom` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `activeTill` DATETIME(3) NOT NULL,
    `priority` INTEGER NOT NULL DEFAULT 3,
    `createdBy` BIGINT NOT NULL,

    INDEX `Notification_schoolId_activeFrom_activeTill_idx`(`schoolId`, `activeFrom`, `activeTill`),
    INDEX `Notification_activeTill_idx`(`activeTill`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `NotificationTarget` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `notificationId` BIGINT NOT NULL,
    `targetType` ENUM('student', 'student_group', 'teacher', 'classroom') NOT NULL,
    `targetId` BIGINT NOT NULL,

    INDEX `NotificationTarget_targetId_idx`(`targetId`),
    UNIQUE INDEX `NotificationTarget_notificationId_targetType_targetId_key`(`notificationId`, `targetType`, `targetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `NotificationRead` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `notificationId` BIGINT NOT NULL,
    `userType` ENUM('student', 'teacher') NOT NULL,
    `userId` BIGINT NOT NULL,
    `readAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `NotificationRead_notificationId_idx`(`notificationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Grade` ADD CONSTRAINT `Grade_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `School`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Section` ADD CONSTRAINT `Section_gradeId_fkey` FOREIGN KEY (`gradeId`) REFERENCES `Grade`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Classroom` ADD CONSTRAINT `Classroom_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `School`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Classroom` ADD CONSTRAINT `Classroom_gradeId_fkey` FOREIGN KEY (`gradeId`) REFERENCES `Grade`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Classroom` ADD CONSTRAINT `Classroom_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `Section`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Student` ADD CONSTRAINT `Student_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `School`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Student` ADD CONSTRAINT `Student_classroomId_fkey` FOREIGN KEY (`classroomId`) REFERENCES `Classroom`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Teacher` ADD CONSTRAINT `Teacher_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `School`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Subject` ADD CONSTRAINT `Subject_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `School`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `TeacherSubject` ADD CONSTRAINT `TeacherSubject_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `Teacher`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `TeacherSubject` ADD CONSTRAINT `TeacherSubject_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `Subject`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `TeacherSubject` ADD CONSTRAINT `TeacherSubject_classroomId_fkey` FOREIGN KEY (`classroomId`) REFERENCES `Classroom`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `StudentSubject` ADD CONSTRAINT `StudentSubject_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `StudentSubject` ADD CONSTRAINT `StudentSubject_teacherSubjectId_fkey` FOREIGN KEY (`teacherSubjectId`) REFERENCES `TeacherSubject`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Exam` ADD CONSTRAINT `Exam_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `Subject`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Exam` ADD CONSTRAINT `Exam_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `Teacher`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Exam` ADD CONSTRAINT `Exam_classroomId_fkey` FOREIGN KEY (`classroomId`) REFERENCES `Classroom`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `StudentExamResult` ADD CONSTRAINT `StudentExamResult_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `Exam`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `StudentExamResult` ADD CONSTRAINT `StudentExamResult_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `AttendanceSession` ADD CONSTRAINT `AttendanceSession_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `School`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `AttendanceSession` ADD CONSTRAINT `AttendanceSession_classroomId_fkey` FOREIGN KEY (`classroomId`) REFERENCES `Classroom`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `AttendanceSession` ADD CONSTRAINT `AttendanceSession_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `Subject`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `StudentAttendance` ADD CONSTRAINT `StudentAttendance_attendanceSessionId_fkey` FOREIGN KEY (`attendanceSessionId`) REFERENCES `AttendanceSession`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `StudentAttendance` ADD CONSTRAINT `StudentAttendance_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `StudentGroup` ADD CONSTRAINT `StudentGroup_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `School`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `StudentGroupMember` ADD CONSTRAINT `StudentGroupMember_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `StudentGroup`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `StudentGroupMember` ADD CONSTRAINT `StudentGroupMember_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Notification` ADD CONSTRAINT `Notification_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `School`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Notification` ADD CONSTRAINT `Notification_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `Teacher`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `NotificationTarget` ADD CONSTRAINT `NotificationTarget_notificationId_fkey` FOREIGN KEY (`notificationId`) REFERENCES `Notification`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `NotificationRead` ADD CONSTRAINT `NotificationRead_notificationId_fkey` FOREIGN KEY (`notificationId`) REFERENCES `Notification`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

