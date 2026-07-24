ALTER TABLE "Plant" ADD COLUMN "clientRequestId" TEXT;
ALTER TABLE "CareInvite" ADD COLUMN "acceptedByUserId" TEXT;

CREATE UNIQUE INDEX "Plant_userId_clientRequestId_key"
  ON "Plant"("userId", "clientRequestId");
CREATE INDEX "CareInvite_acceptedByUserId_idx"
  ON "CareInvite"("acceptedByUserId");
CREATE INDEX "CommunityPost_createdAt_id_idx"
  ON "CommunityPost"("createdAt", "id");
CREATE INDEX "Comment_postId_createdAt_idx"
  ON "Comment"("postId", "createdAt");
