/*
  Warnings:

  - You are about to drop the column `aiAnalysis` on the `SystemDesignSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `feedback` on the `SystemDesignSubmission` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "ComparisonType" ADD VALUE 'SUBSET_MATCH';

-- AlterTable
ALTER TABLE "SystemDesignSubmission" DROP COLUMN "aiAnalysis",
DROP COLUMN "feedback";
