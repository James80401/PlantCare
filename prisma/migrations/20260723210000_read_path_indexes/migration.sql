CREATE INDEX "Plant_userId_createdAt_idx"
  ON "Plant"("userId", "createdAt");
CREATE INDEX "Task_plantId_status_dueDate_idx"
  ON "Task"("plantId", "status", "dueDate");
CREATE INDEX "Task_gardenId_status_dueDate_idx"
  ON "Task"("gardenId", "status", "dueDate");
CREATE INDEX "Recommendation_userId_status_snoozedUntil_priority_idx"
  ON "Recommendation"("userId", "status", "snoozedUntil", "priority");
CREATE INDEX "JournalEntry_plantId_createdAt_idx"
  ON "JournalEntry"("plantId", "createdAt");
CREATE INDEX "Diagnosis_plantId_resolved_createdAt_idx"
  ON "Diagnosis"("plantId", "resolved", "createdAt");
CREATE INDEX "CommunityPost_hiddenAt_createdAt_idx"
  ON "CommunityPost"("hiddenAt", "createdAt");
