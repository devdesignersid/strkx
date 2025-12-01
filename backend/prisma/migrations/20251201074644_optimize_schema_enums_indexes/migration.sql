-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('ACCEPTED', 'REJECTED', 'PENDING', 'COMPILE_ERROR', 'RUNTIME_ERROR', 'TIME_LIMIT_EXCEEDED', 'MEMORY_LIMIT_EXCEEDED');

-- CreateEnum
CREATE TYPE "InterviewSessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "InterviewQuestionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "InterviewQuestionOutcome" AS ENUM ('PASSED', 'FAILED', 'PARTIAL');

-- CreateIndex
CREATE INDEX "InterviewQuestion_status_idx" ON "InterviewQuestion"("status");

-- CreateIndex
CREATE INDEX "Problem_difficulty_idx" ON "Problem"("difficulty");

-- CreateIndex
CREATE INDEX "Submission_executionTime_idx" ON "Submission"("executionTime");

-- CreateIndex
CREATE INDEX "Submission_memoryUsed_idx" ON "Submission"("memoryUsed");
