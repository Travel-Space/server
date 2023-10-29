/*
  Warnings:

  - You are about to drop the column `reportCount` on the `Report` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Report" DROP COLUMN "reportCount";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "reportCount" INTEGER DEFAULT 0;
