-- CreateTable
CREATE TABLE "ViewCount" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "articleId" INTEGER,
    "planetId" INTEGER,

    CONSTRAINT "ViewCount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ViewCount_date_articleId_planetId_key" ON "ViewCount"("date", "articleId", "planetId");

-- AddForeignKey
ALTER TABLE "ViewCount" ADD CONSTRAINT "ViewCount_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewCount" ADD CONSTRAINT "ViewCount_planetId_fkey" FOREIGN KEY ("planetId") REFERENCES "Planet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
