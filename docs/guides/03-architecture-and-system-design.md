# Guide 03 — Architecture & system design

> **Navigation:** [Guides INDEX](INDEX.md) · [Architecture INDEX](../architecture/INDEX.md)

## System overview

```
┌─────────────────────────────────────────────────────────────┐
│  Clients: Browser (Vite/React), Capacitor WebView, PWA      │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS / JSON  /api/v1
┌───────────────────────────▼─────────────────────────────────┐
│  NestJS API (apps/api)                                      │
│  Auth · Users · Plants · Tasks · Scheduler · Diagnosis      │
│  Dashboard · Gardens · Community · Weather · Billing        │
│  CareGuides (internal) · Email · Upload · Notifications     │
└───────────┬─────────────────────────────┬───────────────────┘
            │ Prisma                       │ HTTP SDKs
┌───────────▼──────────┐    ┌─────────────▼──────────────────┐
│  SQLite / PostgreSQL  │    │  OpenAI, PlantNet, Perenual,   │
│                       │    │  Open-Meteo, Stripe, SMTP, S3  │
└───────────────────────┘    └────────────────────────────────┘
```

Deep dive: [architecture/system-overview.md](../architecture/system-overview.md).

---

## API modules (complete list)

| Module | Controller prefix | Responsibility |
|--------|-------------------|----------------|
| **AuthModule** | `/auth` | Register, login, refresh, verify email, password reset |
| **UsersModule** | `/users` | Profile, onboarding, notification settings, delete account |
| **SpeciesModule** | `/species` | Search, browse, recommended, detail |
| **PlantsModule** | `/plants` | CRUD, identify, uploads |
| **TasksModule** | `/tasks` | List, complete, skip, snooze, instructions, schedule suggestions |
| **SchedulerModule** | (internal) | Task generation, reschedule on plant/location change, explanations |
| **JournalModule** | `/plants/:plantId/journal` | Journal CRUD |
| **DiagnosisModule** | `/plants/:id/diagnose*` | Diagnose, conversations, messages, follow-up tasks |
| **CareGuidesModule** | (internal) | Instruction sections, care overview |
| **DashboardModule** | `/dashboard` | Aggregated dashboard payload |
| **GardensModule** | `/gardens` | Households, invites, sharing, activity |
| **CommunityModule** | `/community` | Posts feed |
| **WeatherModule** | `/users/me/weather` | Geocoding, advice cache, per-plant lines |
| **BillingModule** | `/billing` | Stripe checkout + webhook |
| **NotificationsModule** | `/devices` + cron | Push token registration, daily reminders |
| **UploadModule** | (via plants) | Local or S3 image storage |
| **EmailModule** | (internal) | Nodemailer templates |
| **PrismaModule** | — | Database client |
| **HealthController** | `/health` | Liveness |

Registration: `apps/api/src/app.module.ts`.

---

## Request lifecycle

1. **CORS + helmet + rate limit** (`main.ts`).
2. **JWT** on protected routes (`JwtAuthGuard`).
3. **Controller** validates DTO, reads `@CurrentUser().sub`.
4. **Service** applies business rules, calls Prisma and internal services.
5. **Scheduler** hooks on plant create/update regenerate tasks.
6. **JSON response** or HTTP exceptions (`HttpException`).

Details: [architecture/request-flow.md](../architecture/request-flow.md).

---

## Scheduling engine

When a plant is created or key fields change (species, location, light, pot):

1. `SchedulerService` loads species `wateringFreqDays` and care guides.
2. Generates `Task` rows with types (`WATER`, `FERTILIZE`, `REPOT`, …).
3. Outdoor plants may omit indoor-only types (e.g. misting).
4. Location changes trigger reschedule.
5. Skip feedback and season feed **schedule suggestions** (user must approve).

Details: [architecture/scheduling.md](../architecture/scheduling.md).

---

## Diagnosis pipeline

1. User uploads image + optional notes.
2. **Rules engine** may match patterns (overwatering, etc.).
3. Optional **OpenAI** / **Hugging Face** for label + narrative.
4. Result stored as `Diagnosis`; optional **follow-up task** (`HEALTH_CHECK`).
5. **Dr. Plant chat** uses conversation + message models with plant context.

Details: [architecture/diagnosis-pipeline.md](../architecture/diagnosis-pipeline.md).

---

## Care guide pipeline

1. Seed defines `CareGuide` rows per species + task type.
2. `CareGuidesService` personalizes sections (pot size, indoor/outdoor, season).
3. Task instructions API returns sections + image URLs.
4. Static SVG/photos served from `/care-guides/…`.

Details: [architecture/care-guide-pipeline.md](../architecture/care-guide-pipeline.md).

---

## Authorization patterns

| Area | Rule |
|------|------|
| Plants / tasks | Owner `userId` on `Plant` |
| Shared plants | `PlantShare` + `GardenMember` via `task-access.ts` / `garden-authz` |
| Gardens | Member role on `GardenMember` |
| Community posts | Author or admin delete |
| Journal / diagnosis | Plant access (owner or shared read) |

Auth: [architecture/auth-and-security.md](../architecture/auth-and-security.md).

---

## Web architecture

- SPA with React Router; no SSR.
- `ProtectedRoute` + `OnboardingGate` before main `Layout`.
- Data: hooks (`useDashboard`, `useTasksInRange`) + direct API calls.
- Optimistic UI on task complete/skip with refresh.

Details: [07 — Web application](07-web-application.md).

---

## Related docs

- [05 — API reference](05-api-complete-reference.md)
- [04 — Data model](04-data-model-and-persistence.md)
- [09 — Integrations](09-integrations-and-external-services.md)
