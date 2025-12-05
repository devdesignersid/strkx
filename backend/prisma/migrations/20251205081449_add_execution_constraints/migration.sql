-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "inputTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "memoryLimitMb" INTEGER NOT NULL DEFAULT 128,
ADD COLUMN     "returnType" TEXT,
ADD COLUMN     "timeoutMs" INTEGER NOT NULL DEFAULT 2000;

-- CreateIndex
CREATE INDEX "Problem_userId_difficulty_idx" ON "Problem"("userId", "difficulty");
