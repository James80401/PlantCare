# Guide 04 — Data model & persistence

> **Navigation:** [Guides INDEX](INDEX.md) · [Database INDEX](../database/INDEX.md)

## Schemas

| File | Provider | Used by |
|------|----------|---------|
| `prisma/schema.prisma` | SQLite | Local dev, `npm run db:*` default |
| `prisma/schema.postgresql.prisma` | PostgreSQL | Docker API container, production |

Keep both files aligned when adding models or relations.

---

## Entity groups

### Users & billing

| Model | Purpose |
|-------|---------|
| `User` | Account, email, password hash, onboarding prefs, location, plan |
| `Subscription` | Stripe customer/subscription state |
| `DeviceToken` | FCM/APNs token for push (future-heavy) |
| `NotificationLog` | Sent notification audit |

Doc: [database/models/user-and-subscription.md](../database/models/user-and-subscription.md).

### Species & care content

| Model | Purpose |
|-------|---------|
| `PlantSpecies` | Catalog row: names, watering default, toxicity, `metadataJson` |
| `CareGuide` | Instruction template per species + `TaskType` |
| `CareGuideImage` | Linked images for guides |

Doc: [database/models/species-and-care-guide.md](../database/models/species-and-care-guide.md).

### Plants & tasks

| Model | Purpose |
|-------|---------|
| `Plant` | User’s plant instance: nickname, location, light, pot, species link |
| `Task` | Scheduled care action: type, due date, status |
| `TaskFeedback` | Skip reason / feedback for adaptive scheduling |

Doc: [database/models/plant-and-task.md](../database/models/plant-and-task.md).

### Health & journal

| Model | Purpose |
|-------|---------|
| `Diagnosis` | One-shot diagnosis result |
| `DiagnosisConversation` / `DiagnosisMessage` | Dr. Plant chat |
| `JournalEntry` | Notes, photos, dates |

Doc: [database/models/diagnosis-and-journal.md](../database/models/diagnosis-and-journal.md).

### Collaboration (Care Share)

| Model | Purpose |
|-------|---------|
| `Garden` | Named household / shared space |
| `GardenMember` | User membership + role |
| `PlantShare` | Plant visible to garden members |
| `CareInvite` | Pending email invite token |
| `ActivityEvent` | Feed of share/complete events |

Doc: [database/models/collaboration-and-community.md](../database/models/collaboration-and-community.md).

### Community

| Model | Purpose |
|-------|---------|
| `CommunityPost` | User post, optional species/plant/image |
| `Comment` | Schema present; API/UI partial |
| `PostLike` | Schema present; API/UI partial |

### Weather

| Model | Purpose |
|-------|---------|
| `WeatherAdviceCache` | Daily cached advice JSON per user |

---

## Key enums

**`TaskType`** (Prisma): `WATER`, `FERTILIZE`, `REPOT`, `PRUNE`, `MIST`, `WIPE_LEAVES`, `ROTATE`, `CLEAN_LEAVES`, `INSPECT_PESTS`, `CHECK_MOISTURE`, `HEALTH_CHECK`, …

**`TaskStatus`**: `PENDING`, `COMPLETED`, `SKIPPED`, `SNOOZED`

**`PlanTier`**: `FREE`, `PREMIUM`

Full enum list: [database/schema-reference.md](../database/schema-reference.md).

---

## Seeding

`prisma/seed.ts`:

1. Cleans orphan legacy seed species IDs.
2. Upserts species from `prisma/data/species-catalog.ts`.
3. Builds `metadataJson` via `apps/api/src/species/species-metadata.ts`.
4. Runs `seed-care-guides.ts` for guide rows.

```bash
npm run db:seed
```

Docker API entrypoint also runs `db push` + seed on container start.

Details: [database/seeding.md](../database/seeding.md).

---

## Migrations

- Dev often uses `db:push` for speed.
- Production should use `prisma migrate` against Postgres.

Details: [database/migrations.md](../database/migrations.md).

---

## Deletion & cascades

- Deleting a **plant** cascades tasks, journal, diagnoses.
- Deleting a **user** should respect GDPR path via `DELETE /users/me`.
- Garden removal policies: see `gardens.service.ts`.

---

## Related docs

- [05 — API](05-api-complete-reference.md)
- [06 — Care guides content](06-care-guides-and-content.md)
