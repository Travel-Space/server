-- DropForeignKey
ALTER TABLE "Article" DROP CONSTRAINT "Article_planetId_fkey";

-- DropForeignKey
ALTER TABLE "PlanetMembership" DROP CONSTRAINT "PlanetMembership_planetId_fkey";

-- DropForeignKey
ALTER TABLE "Spaceship" DROP CONSTRAINT "Spaceship_planetId_fkey";

-- DropForeignKey
ALTER TABLE "ViewCount" DROP CONSTRAINT "ViewCount_planetId_fkey";

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_planetId_fkey" FOREIGN KEY ("planetId") REFERENCES "Planet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanetMembership" ADD CONSTRAINT "PlanetMembership_planetId_fkey" FOREIGN KEY ("planetId") REFERENCES "Planet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Spaceship" ADD CONSTRAINT "Spaceship_planetId_fkey" FOREIGN KEY ("planetId") REFERENCES "Planet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewCount" ADD CONSTRAINT "ViewCount_planetId_fkey" FOREIGN KEY ("planetId") REFERENCES "Planet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
