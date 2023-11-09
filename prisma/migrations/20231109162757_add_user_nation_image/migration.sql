/*
  Warnings:

  - Added the required column `nationImage` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable

ALTER TABLE "User"
ADD COLUMN "nationImage" VARCHAR(255) NOT NULL DEFAULT '"https://opendata.mofa.go.kr:8444/fileDownload/images/country_images/flags/241/20220224_233513043.gif"';

