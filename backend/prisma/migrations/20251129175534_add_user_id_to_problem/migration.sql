/*
  Warnings:

  - Added the required column `userId` to the `Problem` table without a default value. This is not possible if the table is not empty.

*/
-- Delete existing problems to avoid migration failure due to missing userId
DELETE FROM "Problem";

-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Problem_userId_idx" ON "Problem"("userId");

-- AddForeignKey
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
