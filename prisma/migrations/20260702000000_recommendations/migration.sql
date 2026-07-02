-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "plantId" TEXT,
    "gardenId" TEXT,
    "source" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "actionLabel" TEXT,
    "actionPath" TEXT,
    "suggestedTaskType" TEXT,
    "suggestedTaskDueInDays" INTEGER,
    "metadataJson" TEXT,
    "snoozedUntil" DATETIME,
    "completedAt" DATETIME,
    "dismissedAt" DATETIME,
    "lastRefreshedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Recommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Recommendation_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Recommendation_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Recommendation_userId_sourceKey_key" ON "Recommendation"("userId", "sourceKey");

-- CreateIndex
CREATE INDEX "Recommendation_userId_status_priority_idx" ON "Recommendation"("userId", "status", "priority");

-- CreateIndex
CREATE INDEX "Recommendation_plantId_status_idx" ON "Recommendation"("plantId", "status");

-- CreateIndex
CREATE INDEX "Recommendation_gardenId_status_idx" ON "Recommendation"("gardenId", "status");

-- CreateIndex
CREATE INDEX "Recommendation_lastRefreshedAt_idx" ON "Recommendation"("lastRefreshedAt");
