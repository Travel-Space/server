-- CreateEnum
CREATE TYPE "SpaceshipRole" AS ENUM ('MEMBER', 'OWNER');

-- AlterTable
ALTER TABLE "SpaceshipMember" ADD COLUMN     "role" "SpaceshipRole" NOT NULL DEFAULT 'MEMBER';
