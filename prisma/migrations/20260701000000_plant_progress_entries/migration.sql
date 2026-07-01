-- CreateTable
CREATE TABLE "PlantProgressEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT,
    "photoUrl" TEXT,
    "overallHealth" TEXT NOT NULL,
    "growthChange" TEXT,
    "leafCondition" TEXT,
    "soilMoisture" TEXT,
    "pestSigns" TEXT,
    "recentCare" TEXT,
    "notes" TEXT,
    "analysisSummary" TEXT,
    "adviceText" TEXT,
    "storyJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PlantProgressEntry_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PlantProgressEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PlantProgressEntry_plantId_createdAt_idx" ON "PlantProgressEntry"("plantId", "createdAt");

-- CreateIndex
CREATE INDEX "PlantProgressEntry_userId_createdAt_idx" ON "PlantProgressEntry"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PlantProgressEntry_taskId_idx" ON "PlantProgressEntry"("taskId");
