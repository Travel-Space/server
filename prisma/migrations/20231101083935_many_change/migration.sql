/*
  Warnings:

  - You are about to drop the `SpaceshipApplication` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SpaceshipApplication" DROP CONSTRAINT "SpaceshipApplication_spaceshipId_fkey";

-- DropForeignKey
ALTER TABLE "SpaceshipApplication" DROP CONSTRAINT "SpaceshipApplication_userId_fkey";

-- DropTable
DROP TABLE "SpaceshipApplication";
