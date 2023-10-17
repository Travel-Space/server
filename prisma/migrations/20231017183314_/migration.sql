/*
  Warnings:

  - You are about to drop the column `latitude` on the `Planet` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `Planet` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Planet" DROP COLUMN "latitude",
DROP COLUMN "longitude";

-- AlterTable
ALTER TABLE "PlanetMembership" ADD COLUMN     "status" "MembershipStatus" NOT NULL DEFAULT 'PENDING';
