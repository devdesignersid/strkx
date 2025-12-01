-- CreateTable
CREATE TABLE "SystemDesignProblemsOnLists" (
    "listId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemDesignProblemsOnLists_pkey" PRIMARY KEY ("listId","problemId")
);

-- CreateIndex
CREATE INDEX "SystemDesignProblemsOnLists_listId_idx" ON "SystemDesignProblemsOnLists"("listId");

-- CreateIndex
CREATE INDEX "SystemDesignProblemsOnLists_problemId_idx" ON "SystemDesignProblemsOnLists"("problemId");

-- AddForeignKey
ALTER TABLE "SystemDesignProblemsOnLists" ADD CONSTRAINT "SystemDesignProblemsOnLists_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemDesignProblemsOnLists" ADD CONSTRAINT "SystemDesignProblemsOnLists_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "SystemDesignProblem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
