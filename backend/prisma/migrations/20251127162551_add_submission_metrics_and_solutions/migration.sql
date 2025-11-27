/*
  Warnings:

  - Made the column `output` on table `Submission` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "executionTime" DOUBLE PRECISION,
ADD COLUMN     "isSolution" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "memoryUsed" DOUBLE PRECISION,
ADD COLUMN     "solutionName" TEXT,
ALTER COLUMN "language" DROP DEFAULT,
ALTER COLUMN "output" SET NOT NULL;
