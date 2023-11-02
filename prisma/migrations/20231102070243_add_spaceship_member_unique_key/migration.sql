/*
  Warnings:

  - A unique constraint covering the columns `[spaceshipId,userId]` on the table `SpaceshipMember` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SpaceshipMember_spaceshipId_userId_key" ON "SpaceshipMember"("spaceshipId", "userId");
