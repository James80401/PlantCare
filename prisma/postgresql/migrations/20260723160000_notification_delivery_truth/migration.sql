-- Extend the existing notification ledger so delivery attempts are truthful,
-- retryable per channel, and deduplicated per related record.
ALTER TABLE "NotificationLog"
  ADD COLUMN "dedupeKey" TEXT,
  ADD COLUMN "relatedEntity" TEXT,
  ADD COLUMN "relatedId" TEXT,
  ADD COLUMN "provider" TEXT,
  ADD COLUMN "errorCode" TEXT,
  ADD COLUMN "errorMessage" TEXT,
  ADD COLUMN "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "NotificationLog"
SET "status" = UPPER("status");

ALTER TABLE "NotificationLog"
  ALTER COLUMN "status" SET DEFAULT 'SENT';

CREATE UNIQUE INDEX "NotificationLog_userId_channel_dedupeKey_key"
  ON "NotificationLog"("userId", "channel", "dedupeKey");

CREATE INDEX "NotificationLog_status_attemptedAt_idx"
  ON "NotificationLog"("status", "attemptedAt");

CREATE INDEX "NotificationLog_relatedEntity_relatedId_idx"
  ON "NotificationLog"("relatedEntity", "relatedId");
