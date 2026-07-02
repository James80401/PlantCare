# Schema reference

> **Navigation:** [Database INDEX](INDEX.md)

**File:** `prisma/schema.prisma`

## Enums

`PlanTier`, `TaskType`, `TaskStatus`, `RecommendationStatus`, `RecommendationPriority`, `RecommendationSource`, `PotSize`, `NotificationChannel`, `SubscriptionStatus`

## Models (summary)

| Model | Purpose |
|-------|---------|
| `User` | Account, plan, geo, notifications, auth tokens |
| `Subscription` | Stripe subscription record |
| `PlantSpecies` | Catalog |
| `CareGuide` | Task tutorial content |
| `CareGuideImage` | Illustration metadata |
| `Plant` | User plant instance |
| `Task` | Scheduled care |
| `Recommendation` | Durable non-critical guidance shown on dashboard and plant profiles |
| `JournalEntry` | Notes |
| `Diagnosis` | One-shot results |
| `DiagnosisConversation` | Chat thread |
| `DiagnosisMessage` | Chat messages |
| `NotificationLog` | Sent notifications |
| `DeviceToken` | Push tokens |

Detail: [models/INDEX.md](models/INDEX.md)
