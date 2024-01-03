/*
  Warnings:

  - The values [PLANET_JOIN_APPROVE,PLANET_JOINT_REJECT] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('ARTICLE', 'COMMENT', 'SUB_COMMENT', 'PLANET_INVITE', 'ACTIVITY_RESTRICTION', 'LIKE', 'FOLLOW', 'PLANET_JOIN_REQUEST', 'PLANET_JOIN_APPROVED', 'PLANET_JOIN_REJECTED');
ALTER TABLE "Notification" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "NotificationType_old";
COMMIT;
