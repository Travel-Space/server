/*
  Warnings:

  - You are about to drop the column `administrator` on the `PlanetMembership` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PlanetMemberRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "address" TEXT;

-- AlterTable
ALTER TABLE "PlanetMembership" DROP COLUMN "administrator",
ADD COLUMN     "role" "PlanetMemberRole" NOT NULL DEFAULT 'MEMBER';

-- CreateTable
CREATE TABLE "Location" (
    "id" SERIAL NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "articleId" INTEGER NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
