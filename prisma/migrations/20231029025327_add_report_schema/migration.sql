/*
  Warnings:

  - Added the required column `reportCount` to the `Report` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('RECEIVED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "reportCount" INTEGER NOT NULL,
ADD COLUMN     "status" "ReportStatus" NOT NULL DEFAULT 'RECEIVED';
