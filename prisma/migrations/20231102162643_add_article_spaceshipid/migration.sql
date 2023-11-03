-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "spaceshipId" INTEGER;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_spaceshipId_fkey" FOREIGN KEY ("spaceshipId") REFERENCES "Spaceship"("id") ON DELETE SET NULL ON UPDATE CASCADE;
