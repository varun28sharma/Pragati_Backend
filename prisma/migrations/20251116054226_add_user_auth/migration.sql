-- AlterTable
ALTER TABLE `student` ADD COLUMN `phoneNumber` VARCHAR(15) NULL;

-- CreateTable
CREATE TABLE `User` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `schoolId` BIGINT NULL,
    `email` VARCHAR(120) NOT NULL,
    `phoneNumber` VARCHAR(15) NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `role` ENUM('STUDENT', 'TEACHER', 'GOVERNMENT', 'ADMIN') NOT NULL,
    `status` ENUM('active', 'blocked') NOT NULL DEFAULT 'active',
    `studentId` BIGINT NULL,
    `teacherId` BIGINT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_studentId_key`(`studentId`),
    INDEX `User_role_idx`(`role`),
    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_phoneNumber_key`(`phoneNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Student_phoneNumber_key` ON `Student`(`phoneNumber`);

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `School`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `Teacher`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
