/*
  Warnings:

  - Added the required column `requestedById` to the `GroupJoinRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GroupJoinRequest" ADD COLUMN     "requestedById" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "GroupJoinRequest" ADD CONSTRAINT "GroupJoinRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
