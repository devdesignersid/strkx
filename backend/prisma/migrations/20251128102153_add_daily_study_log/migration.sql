-- CreateTable
CREATE TABLE "DailyStudyLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalStudySeconds" INTEGER NOT NULL DEFAULT 0,
    "sessionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyStudyLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyStudyLog_userId_idx" ON "DailyStudyLog"("userId");

-- CreateIndex
CREATE INDEX "DailyStudyLog_date_idx" ON "DailyStudyLog"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyStudyLog_userId_date_key" ON "DailyStudyLog"("userId", "date");

-- AddForeignKey
ALTER TABLE "DailyStudyLog" ADD CONSTRAINT "DailyStudyLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
