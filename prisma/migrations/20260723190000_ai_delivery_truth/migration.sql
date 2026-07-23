ALTER TABLE "DiagnosisConversation" ADD COLUMN "clientRequestId" TEXT;
ALTER TABLE "DiagnosisMessage" ADD COLUMN "clientRequestId" TEXT;
ALTER TABLE "DiagnosisMessage" ADD COLUMN "source" TEXT;

CREATE UNIQUE INDEX "DiagnosisConversation_userId_clientRequestId_key"
  ON "DiagnosisConversation"("userId", "clientRequestId");
CREATE UNIQUE INDEX "DiagnosisMessage_conversationId_clientRequestId_role_key"
  ON "DiagnosisMessage"("conversationId", "clientRequestId", "role");
