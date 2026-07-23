-- SQLite development history for the notification delivery ledger.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- The legacy SQLite migration history predates this development-only table.
-- Creating its old shape when absent keeps this migration usable for both
-- existing developer databases and fresh migration rehearsals.
CREATE TABLE IF NOT EXISTS "NotificationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "new_NotificationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "dedupeKey" TEXT,
    "relatedEntity" TEXT,
    "relatedId" TEXT,
    "provider" TEXT,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "attemptedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_NotificationLog" (
    "id", "userId", "channel", "message", "status", "attemptedAt", "createdAt"
)
SELECT
    "id", "userId", "channel", "message", UPPER("status"), "createdAt", "createdAt"
FROM "NotificationLog";

DROP TABLE "NotificationLog";
ALTER TABLE "new_NotificationLog" RENAME TO "NotificationLog";

CREATE UNIQUE INDEX "NotificationLog_userId_channel_dedupeKey_key"
  ON "NotificationLog"("userId", "channel", "dedupeKey");
CREATE INDEX "NotificationLog_userId_idx" ON "NotificationLog"("userId");
CREATE INDEX "NotificationLog_status_attemptedAt_idx"
  ON "NotificationLog"("status", "attemptedAt");
CREATE INDEX "NotificationLog_relatedEntity_relatedId_idx"
  ON "NotificationLog"("relatedEntity", "relatedId");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
