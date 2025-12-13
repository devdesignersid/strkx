-- CreateEnum
CREATE TYPE "ComparisonType" AS ENUM ('STRICT', 'ORDER_INSENSITIVE', 'FLOAT_TOLERANCE');

-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "comparisonType" "ComparisonType" NOT NULL DEFAULT 'STRICT';
