/*
  Warnings:

  - The `shape` column on the `Planet` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Planet" DROP COLUMN "shape",
ADD COLUMN     "shape" TEXT NOT NULL DEFAULT 'SHAPE1';

-- DropEnum
DROP TYPE "PlanetShape";
