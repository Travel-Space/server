/*
  Warnings:

  - You are about to drop the column `ownerId` on the `Notification` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "ownerId",
ADD COLUMN     "requestUserId" INTEGER;
