/*
  Warnings:

  - A unique constraint covering the columns `[userId,slug]` on the table `Problem` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Problem_slug_key";

-- CreateIndex
CREATE UNIQUE INDEX "Problem_userId_slug_key" ON "Problem"("userId", "slug");
