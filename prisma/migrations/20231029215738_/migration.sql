-- DropForeignKey
ALTER TABLE "Image" DROP CONSTRAINT "Image_articleId_fkey";

-- AlterTable
ALTER TABLE "Image" ALTER COLUMN "url" DROP NOT NULL,
ALTER COLUMN "articleId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;
