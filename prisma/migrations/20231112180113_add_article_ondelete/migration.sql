-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_articleId_fkey";

-- DropForeignKey
ALTER TABLE "Image" DROP CONSTRAINT "Image_articleId_fkey";

-- DropForeignKey
ALTER TABLE "Location" DROP CONSTRAINT "Location_articleId_fkey";

-- DropForeignKey
ALTER TABLE "ViewCount" DROP CONSTRAINT "ViewCount_articleId_fkey";

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewCount" ADD CONSTRAINT "ViewCount_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
