/*
  Warnings:

  - You are about to drop the `Location` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Location" DROP CONSTRAINT "Location_articleId_fkey";

-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- DropTable
DROP TABLE "Location";
