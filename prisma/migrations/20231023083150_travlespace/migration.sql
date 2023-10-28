/*
  Warnings:

  - Added the required column `image` to the `Spaceship` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Spaceship" ADD COLUMN     "image" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "SpaceshipApplication" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "spaceshipId" INTEGER NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpaceshipApplication_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SpaceshipApplication" ADD CONSTRAINT "SpaceshipApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceshipApplication" ADD CONSTRAINT "SpaceshipApplication_spaceshipId_fkey" FOREIGN KEY ("spaceshipId") REFERENCES "Spaceship"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
