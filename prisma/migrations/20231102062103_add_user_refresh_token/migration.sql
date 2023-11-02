/*
  Warnings:

  - You are about to drop the column `refreshToken` on the `Article` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Article" DROP COLUMN "refreshToken";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "refreshToken" TEXT;
