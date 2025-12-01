-- CreateTable
CREATE TABLE "SystemDesignProblem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'Medium',
    "defaultDuration" INTEGER NOT NULL DEFAULT 45,
    "tags" TEXT[],
    "constraints" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "SystemDesignProblem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemDesignSubmission" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "excalidrawJson" JSONB NOT NULL,
    "notesMarkdown" TEXT,
    "timeSpentSeconds" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "score" INTEGER,
    "feedback" TEXT,
    "aiAnalysis" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemDesignSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemDesignSolution" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "diagramSnapshot" TEXT,
    "excalidrawJson" JSONB,
    "author" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemDesignSolution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SystemDesignProblem_userId_idx" ON "SystemDesignProblem"("userId");

-- CreateIndex
CREATE INDEX "SystemDesignSubmission_userId_idx" ON "SystemDesignSubmission"("userId");

-- CreateIndex
CREATE INDEX "SystemDesignSubmission_problemId_idx" ON "SystemDesignSubmission"("problemId");

-- CreateIndex
CREATE INDEX "SystemDesignSolution_problemId_idx" ON "SystemDesignSolution"("problemId");

-- AddForeignKey
ALTER TABLE "SystemDesignProblem" ADD CONSTRAINT "SystemDesignProblem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemDesignSubmission" ADD CONSTRAINT "SystemDesignSubmission_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "SystemDesignProblem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemDesignSubmission" ADD CONSTRAINT "SystemDesignSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemDesignSolution" ADD CONSTRAINT "SystemDesignSolution_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "SystemDesignProblem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
