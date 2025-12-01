/*
  Warnings:

  - A unique constraint covering the columns `[userId,slug]` on the table `SystemDesignProblem` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "SystemDesignProblem_slug_key";

-- CreateIndex
CREATE UNIQUE INDEX "SystemDesignProblem_userId_slug_key" ON "SystemDesignProblem"("userId", "slug");
