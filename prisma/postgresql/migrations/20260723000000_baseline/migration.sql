-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'PREMIUM');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('WATER', 'FERTILIZE', 'PRUNE', 'MIST', 'PH_TEST', 'PEST_CONTROL', 'REPOT', 'ROTATE', 'CLEAN_LEAVES', 'INSPECT_PESTS', 'CHECK_MOISTURE', 'HEALTH_CHECK');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'DONE', 'SKIPPED');

-- CreateEnum
CREATE TYPE "RecommendationStatus" AS ENUM ('ACTIVE', 'DONE', 'SNOOZED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "RecommendationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "RecommendationSource" AS ENUM ('DR_PLANT', 'PLANT_CHECK_IN', 'CARE_TIMING', 'ENVIRONMENT', 'SEASONAL', 'SYSTEM');

-- CreateEnum
CREATE TYPE "PotSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

-- CreateEnum
CREATE TYPE "PlantLifeStage" AS ENUM ('SEED', 'SPROUT', 'SEEDLING', 'YOUNG_PLANT', 'ESTABLISHED', 'MATURE');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('PUSH', 'EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED', 'PAST_DUE', 'TRIALING');

-- CreateEnum
CREATE TYPE "AccountApprovalStatus" AS ENUM ('APPROVED', 'PENDING', 'REJECTED');

-- CreateEnum
CREATE TYPE "GrowthStage" AS ENUM ('SEED', 'SPROUT', 'SEEDLING', 'YOUNG_PLANT', 'ESTABLISHED', 'ANCIENT');

-- CreateEnum
CREATE TYPE "BuddyTrait" AS ENUM ('RESILIENT', 'SUN_SEEKER', 'NIGHT_BLOOMER', 'WILD', 'TENDER');

-- CreateEnum
CREATE TYPE "BuddyMood" AS ENUM ('THRIVING', 'HAPPY', 'CONTENT', 'WILTING', 'THIRSTY', 'DORMANT');

-- CreateEnum
CREATE TYPE "ItemCategory" AS ENUM ('HAT', 'TOP', 'SHOES', 'GLASSES', 'HELD_ITEM', 'POT_SKIN', 'BODY_COLOR', 'BODY_PATTERN', 'COMPANION', 'WINGS', 'BACKGROUND', 'FURNITURE');

-- CreateEnum
CREATE TYPE "ItemUnlockType" AS ENUM ('PURCHASE', 'QUEST_REWARD', 'JOURNEY_DROP', 'ACHIEVEMENT', 'SEASONAL_EVENT', 'SPECIES_UNLOCK', 'DEFAULT_ITEM');

-- CreateEnum
CREATE TYPE "BuddySpeciesUnlockType" AS ENUM ('DEFAULT', 'DEWDROPS', 'STREAK', 'QUEST', 'JOURNEY_COUNT', 'LEVEL', 'SEASONAL');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('WATERING_CHECK', 'SUNLIGHT_AUDIT', 'PEST_INSPECTION', 'PLANT_JOURNAL', 'REPOTTING_GUIDE', 'SEASON_CHECK', 'PROGRESS_PHOTO', 'HUMIDITY_CHECK', 'PRUNING_GUIDE', 'PROPAGATION_LOG');

-- CreateEnum
CREATE TYPE "QuestType" AS ENUM ('DAILY', 'MONTHLY_CHALLENGE', 'ACHIEVEMENT', 'SEASONAL_EVENT', 'FRIENDSHIP');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "planTier" "PlanTier" NOT NULL DEFAULT 'FREE',
    "stripeCustomerId" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "locationLabel" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "temperatureUnit" TEXT NOT NULL DEFAULT 'C',
    "notifyPush" BOOLEAN NOT NULL DEFAULT true,
    "notifyEmail" BOOLEAN NOT NULL DEFAULT true,
    "notifySms" BOOLEAN NOT NULL DEFAULT false,
    "phone" TEXT,
    "quietHoursStart" INTEGER,
    "quietHoursEnd" INTEGER,
    "reminderHour" INTEGER,
    "identifyCountThisMonth" INTEGER NOT NULL DEFAULT 0,
    "identifyCountResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailVerified" BOOLEAN NOT NULL DEFAULT true,
    "accountApprovalStatus" "AccountApprovalStatus" NOT NULL DEFAULT 'APPROVED',
    "emailVerificationToken" TEXT,
    "emailVerificationExpires" TIMESTAMP(3),
    "passwordResetToken" TEXT,
    "passwordResetExpires" TIMESTAMP(3),
    "aiPausedUntil" TIMESTAMP(3),
    "experienceLevel" TEXT,
    "defaultLightLevel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorEmail" TEXT,
    "action" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "targetUserId" TEXT,
    "requestId" TEXT,
    "statusCode" INTEGER NOT NULL,
    "outcome" TEXT NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiUsageEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "plantId" TEXT,
    "conversationId" TEXT,
    "promptChars" INTEGER NOT NULL DEFAULT 0,
    "imageCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiUsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "parentId" TEXT,
    "replacedBy" TEXT,
    "revokedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "ip" TEXT,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherAdviceCache" (
    "userId" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "localDateKey" TEXT NOT NULL,
    "locationKey" TEXT NOT NULL,
    "payload" TEXT NOT NULL,

    CONSTRAINT "WeatherAdviceCache_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "stripeId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantSpecies" (
    "id" TEXT NOT NULL,
    "perenualId" INTEGER,
    "commonName" TEXT NOT NULL,
    "scientificName" TEXT,
    "sunlight" TEXT,
    "wateringFreqDays" INTEGER NOT NULL DEFAULT 7,
    "toxicity" TEXT,
    "phMin" DOUBLE PRECISION,
    "phMax" DOUBLE PRECISION,
    "careNotes" TEXT,
    "defaultImageUrl" TEXT,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlantSpecies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareGuide" (
    "id" TEXT NOT NULL,
    "taskType" "TaskType" NOT NULL,
    "speciesId" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "sectionsJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareGuide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareGuideImage" (
    "id" TEXT NOT NULL,
    "careGuideId" TEXT NOT NULL,
    "imageKey" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "altText" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CareGuideImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gardenId" TEXT NOT NULL,
    "speciesId" TEXT NOT NULL,
    "nickname" TEXT,
    "location" TEXT,
    "potSize" "PotSize" NOT NULL DEFAULT 'MEDIUM',
    "lifeStage" "PlantLifeStage" NOT NULL DEFAULT 'ESTABLISHED',
    "approximateAgeMonths" INTEGER,
    "datePlanted" TIMESTAMP(3),
    "imageUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantMilestone" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plantId" TEXT,
    "milestoneKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlantMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "gardenId" TEXT,
    "taskType" "TaskType" NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "notifiedAt" TIMESTAMP(3),
    "sourceDiagnosisId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskFeedback" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plantId" TEXT,
    "gardenId" TEXT,
    "source" "RecommendationSource" NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "priority" "RecommendationPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "RecommendationStatus" NOT NULL DEFAULT 'ACTIVE',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "actionLabel" TEXT,
    "actionPath" TEXT,
    "suggestedTaskType" "TaskType",
    "suggestedTaskDueInDays" INTEGER,
    "metadataJson" TEXT,
    "snoozedUntil" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "notifiedAt" TIMESTAMP(3),
    "lastRefreshedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "photoUrl" TEXT,
    "notes" TEXT,
    "heightCm" DOUBLE PRECISION,
    "widthCm" DOUBLE PRECISION,
    "leafCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantProgressEntry" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlantProgressEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Diagnosis" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "imageUrl" TEXT,
    "symptomsText" TEXT,
    "resultLabel" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "adviceText" TEXT,
    "source" TEXT NOT NULL DEFAULT 'rules',
    "detailJson" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Diagnosis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosisConversation" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiagnosisConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosisMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosisMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Garden" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Garden_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GardenMember" (
    "id" TEXT NOT NULL,
    "gardenId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GardenMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantShare" (
    "id" TEXT NOT NULL,
    "gardenId" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "canComplete" BOOLEAN NOT NULL DEFAULT true,
    "canJournal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PlantShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareInvite" (
    "id" TEXT NOT NULL,
    "gardenId" TEXT NOT NULL,
    "email" TEXT,
    "token" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityPost" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "speciesId" TEXT,
    "imageUrl" TEXT,
    "tagsJson" TEXT,
    "originalPostId" TEXT,
    "hiddenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostReport" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockedUser" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockedUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Follow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostLike" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityEvent" (
    "id" TEXT NOT NULL,
    "gardenId" TEXT,
    "actorId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Buddy" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "speciesId" TEXT NOT NULL DEFAULT 'monstera',
    "trait" "BuddyTrait" NOT NULL DEFAULT 'RESILIENT',
    "growthStage" "GrowthStage" NOT NULL DEFAULT 'SEED',
    "journeyCount" INTEGER NOT NULL DEFAULT 0,
    "dewdrops" INTEGER NOT NULL DEFAULT 0,
    "experiencePoints" INTEGER NOT NULL DEFAULT 0,
    "bloomTokens" INTEGER NOT NULL DEFAULT 0,
    "lastPerfectDayKey" TEXT,
    "sunlightToday" INTEGER NOT NULL DEFAULT 0,
    "tasksToday" INTEGER NOT NULL DEFAULT 0,
    "lastResetDate" TIMESTAMP(3),
    "mood" "BuddyMood" NOT NULL DEFAULT 'HAPPY',
    "lastTaskDate" TIMESTAMP(3),
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDate" TIMESTAMP(3),
    "equippedItems" JSONB NOT NULL DEFAULT '{}',
    "unlockedSpecies" JSONB NOT NULL DEFAULT '["monstera"]',
    "currentBiome" TEXT NOT NULL DEFAULT 'seed_garden',
    "unlockedBiomes" JSONB NOT NULL DEFAULT '["seed_garden"]',
    "personalityChoices" JSONB NOT NULL DEFAULT '[]',
    "terrariumLayout" JSONB NOT NULL DEFAULT '{}',
    "terrariumBackground" TEXT NOT NULL DEFAULT 'sunny_windowsill',
    "floatingCompanionMode" TEXT NOT NULL DEFAULT 'hidden',
    "gardenCode" TEXT NOT NULL,
    "showLastActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Buddy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuddyJourney" (
    "id" TEXT NOT NULL,
    "buddyId" TEXT NOT NULL,
    "biomeId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "discoveryId" TEXT,
    "choiceMade" INTEGER,
    "dewdropsEarned" INTEGER NOT NULL DEFAULT 0,
    "itemDropped" TEXT,
    "companionDropped" TEXT,
    "tasksCompletedDuring" INTEGER NOT NULL DEFAULT 0,
    "minutesSaved" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BuddyJourney_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ItemCategory" NOT NULL,
    "tier" INTEGER NOT NULL,
    "cost" INTEGER NOT NULL,
    "bloomTokenCost" INTEGER NOT NULL DEFAULT 0,
    "seasonalEventId" TEXT,
    "requiresPremium" BOOLEAN NOT NULL DEFAULT false,
    "speciesLocked" TEXT,
    "unlockType" "ItemUnlockType" NOT NULL DEFAULT 'PURCHASE',
    "imageKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShopItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuddyInventory" (
    "id" TEXT NOT NULL,
    "buddyId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acquireMethod" TEXT NOT NULL,

    CONSTRAINT "BuddyInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuddySpecies" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "unlockType" "BuddySpeciesUnlockType" NOT NULL DEFAULT 'DEFAULT',
    "unlockValue" INTEGER,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BuddySpecies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuddyActivity" (
    "id" TEXT NOT NULL,
    "buddyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationSeconds" INTEGER,
    "sunlightEarned" INTEGER NOT NULL,
    "dewdropsEarned" INTEGER NOT NULL,
    "taskId" TEXT,
    "journalEntryId" TEXT,
    "diagnosisId" TEXT,
    "plantId" TEXT,
    "notes" TEXT,

    CONSTRAINT "BuddyActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quest" (
    "id" TEXT NOT NULL,
    "type" "QuestType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirement" JSONB NOT NULL,
    "rewardDewdrops" INTEGER NOT NULL,
    "rewardItemId" TEXT,
    "rewardBadgeId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuddyQuestProgress" (
    "id" TEXT NOT NULL,
    "buddyId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "rewardClaimed" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuddyQuestProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyChallenge" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "steps" JSONB NOT NULL,
    "rewardDewdrops" INTEGER NOT NULL,
    "rewardItemId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonthlyChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuddyChallengeProgress" (
    "id" TEXT NOT NULL,
    "buddyId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "stepsCompleted" INTEGER NOT NULL DEFAULT 0,
    "completedStepIds" JSONB NOT NULL DEFAULT '[]',
    "completedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuddyChallengeProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuddyFriendship" (
    "id" TEXT NOT NULL,
    "fromBuddyId" TEXT NOT NULL,
    "toBuddyId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "points" INTEGER NOT NULL DEFAULT 0,
    "lastSunshineSentAt" TIMESTAMP(3),
    "totalSunshineSent" INTEGER NOT NULL DEFAULT 0,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "BuddyFriendship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SunshineEvent" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "fromBuddyId" TEXT NOT NULL,
    "toBuddyId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dewdropsAwarded" INTEGER NOT NULL DEFAULT 3,

    CONSTRAINT "SunshineEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_emailVerificationToken_key" ON "User"("emailVerificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_passwordResetToken_key" ON "User"("passwordResetToken");

-- CreateIndex
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_actorUserId_createdAt_idx" ON "AdminAuditLog"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_targetUserId_createdAt_idx" ON "AdminAuditLog"("targetUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_action_createdAt_idx" ON "AdminAuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_outcome_createdAt_idx" ON "AdminAuditLog"("outcome", "createdAt");

-- CreateIndex
CREATE INDEX "AiUsageEvent_userId_createdAt_idx" ON "AiUsageEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AiUsageEvent_feature_createdAt_idx" ON "AiUsageEvent"("feature", "createdAt");

-- CreateIndex
CREATE INDEX "AiUsageEvent_status_createdAt_idx" ON "AiUsageEvent"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_familyId_idx" ON "RefreshToken"("familyId");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlantSpecies_perenualId_key" ON "PlantSpecies"("perenualId");

-- CreateIndex
CREATE INDEX "PlantSpecies_commonName_idx" ON "PlantSpecies"("commonName");

-- CreateIndex
CREATE INDEX "CareGuide_taskType_idx" ON "CareGuide"("taskType");

-- CreateIndex
CREATE UNIQUE INDEX "CareGuide_taskType_speciesId_key" ON "CareGuide"("taskType", "speciesId");

-- CreateIndex
CREATE INDEX "CareGuideImage_careGuideId_idx" ON "CareGuideImage"("careGuideId");

-- CreateIndex
CREATE INDEX "Plant_userId_idx" ON "Plant"("userId");

-- CreateIndex
CREATE INDEX "Plant_gardenId_idx" ON "Plant"("gardenId");

-- CreateIndex
CREATE INDEX "PlantMilestone_userId_idx" ON "PlantMilestone"("userId");

-- CreateIndex
CREATE INDEX "PlantMilestone_plantId_idx" ON "PlantMilestone"("plantId");

-- CreateIndex
CREATE UNIQUE INDEX "PlantMilestone_userId_milestoneKey_key" ON "PlantMilestone"("userId", "milestoneKey");

-- CreateIndex
CREATE INDEX "Task_dueDate_status_idx" ON "Task"("dueDate", "status");

-- CreateIndex
CREATE INDEX "Task_plantId_idx" ON "Task"("plantId");

-- CreateIndex
CREATE INDEX "Task_gardenId_status_idx" ON "Task"("gardenId", "status");

-- CreateIndex
CREATE INDEX "Task_sourceDiagnosisId_idx" ON "Task"("sourceDiagnosisId");

-- CreateIndex
CREATE INDEX "TaskFeedback_taskId_idx" ON "TaskFeedback"("taskId");

-- CreateIndex
CREATE INDEX "TaskFeedback_userId_createdAt_idx" ON "TaskFeedback"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "TaskFeedback_reason_idx" ON "TaskFeedback"("reason");

-- CreateIndex
CREATE INDEX "Recommendation_userId_status_priority_idx" ON "Recommendation"("userId", "status", "priority");

-- CreateIndex
CREATE INDEX "Recommendation_plantId_status_idx" ON "Recommendation"("plantId", "status");

-- CreateIndex
CREATE INDEX "Recommendation_gardenId_status_idx" ON "Recommendation"("gardenId", "status");

-- CreateIndex
CREATE INDEX "Recommendation_lastRefreshedAt_idx" ON "Recommendation"("lastRefreshedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Recommendation_userId_sourceKey_key" ON "Recommendation"("userId", "sourceKey");

-- CreateIndex
CREATE INDEX "JournalEntry_plantId_idx" ON "JournalEntry"("plantId");

-- CreateIndex
CREATE INDEX "PlantProgressEntry_plantId_createdAt_idx" ON "PlantProgressEntry"("plantId", "createdAt");

-- CreateIndex
CREATE INDEX "PlantProgressEntry_userId_createdAt_idx" ON "PlantProgressEntry"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PlantProgressEntry_taskId_idx" ON "PlantProgressEntry"("taskId");

-- CreateIndex
CREATE INDEX "Diagnosis_plantId_idx" ON "Diagnosis"("plantId");

-- CreateIndex
CREATE INDEX "Diagnosis_plantId_resolved_idx" ON "Diagnosis"("plantId", "resolved");

-- CreateIndex
CREATE INDEX "DiagnosisConversation_plantId_idx" ON "DiagnosisConversation"("plantId");

-- CreateIndex
CREATE INDEX "DiagnosisConversation_userId_idx" ON "DiagnosisConversation"("userId");

-- CreateIndex
CREATE INDEX "DiagnosisMessage_conversationId_idx" ON "DiagnosisMessage"("conversationId");

-- CreateIndex
CREATE INDEX "NotificationLog_userId_idx" ON "NotificationLog"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceToken_userId_token_key" ON "DeviceToken"("userId", "token");

-- CreateIndex
CREATE INDEX "Garden_ownerId_idx" ON "Garden"("ownerId");

-- CreateIndex
CREATE INDEX "GardenMember_userId_idx" ON "GardenMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GardenMember_gardenId_userId_key" ON "GardenMember"("gardenId", "userId");

-- CreateIndex
CREATE INDEX "PlantShare_plantId_idx" ON "PlantShare"("plantId");

-- CreateIndex
CREATE UNIQUE INDEX "PlantShare_gardenId_plantId_key" ON "PlantShare"("gardenId", "plantId");

-- CreateIndex
CREATE UNIQUE INDEX "CareInvite_token_key" ON "CareInvite"("token");

-- CreateIndex
CREATE INDEX "CareInvite_gardenId_idx" ON "CareInvite"("gardenId");

-- CreateIndex
CREATE INDEX "CareInvite_email_idx" ON "CareInvite"("email");

-- CreateIndex
CREATE INDEX "CommunityPost_authorId_idx" ON "CommunityPost"("authorId");

-- CreateIndex
CREATE INDEX "CommunityPost_createdAt_idx" ON "CommunityPost"("createdAt");

-- CreateIndex
CREATE INDEX "CommunityPost_originalPostId_idx" ON "CommunityPost"("originalPostId");

-- CreateIndex
CREATE INDEX "PostReport_postId_idx" ON "PostReport"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "PostReport_postId_reporterId_key" ON "PostReport"("postId", "reporterId");

-- CreateIndex
CREATE INDEX "BlockedUser_blockerId_idx" ON "BlockedUser"("blockerId");

-- CreateIndex
CREATE UNIQUE INDEX "BlockedUser_blockerId_blockedId_key" ON "BlockedUser"("blockerId", "blockedId");

-- CreateIndex
CREATE INDEX "Follow_followerId_idx" ON "Follow"("followerId");

-- CreateIndex
CREATE INDEX "Follow_followingId_idx" ON "Follow"("followingId");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_followerId_followingId_key" ON "Follow"("followerId", "followingId");

-- CreateIndex
CREATE INDEX "Comment_postId_idx" ON "Comment"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "PostLike_postId_userId_key" ON "PostLike"("postId", "userId");

-- CreateIndex
CREATE INDEX "ActivityEvent_gardenId_createdAt_idx" ON "ActivityEvent"("gardenId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityEvent_actorId_idx" ON "ActivityEvent"("actorId");

-- CreateIndex
CREATE UNIQUE INDEX "Buddy_userId_key" ON "Buddy"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Buddy_gardenCode_key" ON "Buddy"("gardenCode");

-- CreateIndex
CREATE INDEX "BuddyJourney_buddyId_completed_idx" ON "BuddyJourney"("buddyId", "completed");

-- CreateIndex
CREATE UNIQUE INDEX "BuddyInventory_buddyId_itemId_key" ON "BuddyInventory"("buddyId", "itemId");

-- CreateIndex
CREATE INDEX "BuddyActivity_buddyId_completedAt_idx" ON "BuddyActivity"("buddyId", "completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BuddyQuestProgress_buddyId_questId_key" ON "BuddyQuestProgress"("buddyId", "questId");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyChallenge_month_year_key" ON "MonthlyChallenge"("month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "BuddyChallengeProgress_buddyId_challengeId_key" ON "BuddyChallengeProgress"("buddyId", "challengeId");

-- CreateIndex
CREATE INDEX "BuddyFriendship_toBuddyId_idx" ON "BuddyFriendship"("toBuddyId");

-- CreateIndex
CREATE UNIQUE INDEX "BuddyFriendship_fromBuddyId_toBuddyId_key" ON "BuddyFriendship"("fromBuddyId", "toBuddyId");

-- CreateIndex
CREATE INDEX "SunshineEvent_toUserId_sentAt_idx" ON "SunshineEvent"("toUserId", "sentAt");

-- CreateIndex
CREATE INDEX "SunshineEvent_fromUserId_sentAt_idx" ON "SunshineEvent"("fromUserId", "sentAt");

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiUsageEvent" ADD CONSTRAINT "AiUsageEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeatherAdviceCache" ADD CONSTRAINT "WeatherAdviceCache_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareGuide" ADD CONSTRAINT "CareGuide_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "PlantSpecies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareGuideImage" ADD CONSTRAINT "CareGuideImage_careGuideId_fkey" FOREIGN KEY ("careGuideId") REFERENCES "CareGuide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plant" ADD CONSTRAINT "Plant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plant" ADD CONSTRAINT "Plant_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plant" ADD CONSTRAINT "Plant_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "PlantSpecies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantMilestone" ADD CONSTRAINT "PlantMilestone_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantMilestone" ADD CONSTRAINT "PlantMilestone_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_sourceDiagnosisId_fkey" FOREIGN KEY ("sourceDiagnosisId") REFERENCES "Diagnosis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskFeedback" ADD CONSTRAINT "TaskFeedback_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskFeedback" ADD CONSTRAINT "TaskFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantProgressEntry" ADD CONSTRAINT "PlantProgressEntry_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantProgressEntry" ADD CONSTRAINT "PlantProgressEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diagnosis" ADD CONSTRAINT "Diagnosis_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosisConversation" ADD CONSTRAINT "DiagnosisConversation_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosisMessage" ADD CONSTRAINT "DiagnosisMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "DiagnosisConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceToken" ADD CONSTRAINT "DeviceToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Garden" ADD CONSTRAINT "Garden_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GardenMember" ADD CONSTRAINT "GardenMember_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GardenMember" ADD CONSTRAINT "GardenMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantShare" ADD CONSTRAINT "PlantShare_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantShare" ADD CONSTRAINT "PlantShare_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareInvite" ADD CONSTRAINT "CareInvite_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "PlantSpecies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_originalPostId_fkey" FOREIGN KEY ("originalPostId") REFERENCES "CommunityPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostReport" ADD CONSTRAINT "PostReport_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostReport" ADD CONSTRAINT "PostReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedUser" ADD CONSTRAINT "BlockedUser_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedUser" ADD CONSTRAINT "BlockedUser_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostLike" ADD CONSTRAINT "PostLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostLike" ADD CONSTRAINT "PostLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Buddy" ADD CONSTRAINT "Buddy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuddyJourney" ADD CONSTRAINT "BuddyJourney_buddyId_fkey" FOREIGN KEY ("buddyId") REFERENCES "Buddy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuddyInventory" ADD CONSTRAINT "BuddyInventory_buddyId_fkey" FOREIGN KEY ("buddyId") REFERENCES "Buddy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuddyInventory" ADD CONSTRAINT "BuddyInventory_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ShopItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuddyActivity" ADD CONSTRAINT "BuddyActivity_buddyId_fkey" FOREIGN KEY ("buddyId") REFERENCES "Buddy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuddyQuestProgress" ADD CONSTRAINT "BuddyQuestProgress_buddyId_fkey" FOREIGN KEY ("buddyId") REFERENCES "Buddy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuddyQuestProgress" ADD CONSTRAINT "BuddyQuestProgress_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuddyChallengeProgress" ADD CONSTRAINT "BuddyChallengeProgress_buddyId_fkey" FOREIGN KEY ("buddyId") REFERENCES "Buddy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuddyChallengeProgress" ADD CONSTRAINT "BuddyChallengeProgress_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "MonthlyChallenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuddyFriendship" ADD CONSTRAINT "BuddyFriendship_fromBuddyId_fkey" FOREIGN KEY ("fromBuddyId") REFERENCES "Buddy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuddyFriendship" ADD CONSTRAINT "BuddyFriendship_toBuddyId_fkey" FOREIGN KEY ("toBuddyId") REFERENCES "Buddy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
