/*
  Warnings:

  - You are about to drop the column `title` on the `Spaceship` table. All the data in the column will be lost.
  - Added the required column `name` to the `Spaceship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerId` to the `Spaceship` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Spaceship" DROP COLUMN "title",
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "ownerId" INTEGER NOT NULL;
