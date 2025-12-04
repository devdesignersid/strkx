-- CreateEnum
CREATE TYPE "ProblemType" AS ENUM ('ALGORITHM', 'DESIGN');

-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "className" TEXT,
ADD COLUMN     "type" "ProblemType" NOT NULL DEFAULT 'ALGORITHM';
