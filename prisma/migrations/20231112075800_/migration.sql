/*
  Warnings:

  - Added the required column `type` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ARTICLE', 'COMMENT', 'SUB_COMMENT', 'PLANET_INVITE', 'ACTIVITY_RESTRICTION', 'LIKE', 'FOLLOW');

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "type" "NotificationType" NOT NULL;
