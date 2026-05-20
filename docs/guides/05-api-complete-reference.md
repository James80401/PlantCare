# Guide 05 — API complete reference

> **Navigation:** [Guides INDEX](INDEX.md) · [API INDEX](../api/INDEX.md) · **Swagger:** `http://localhost:3001/api/docs`

## Conventions

| Item | Value |
|------|--------|
| Base path | `/api/v1` |
| Auth | `Authorization: Bearer <accessToken>` (except public auth routes) |
| Content-Type | `application/json` (multipart for uploads) |
| Errors | `{ statusCode, message, error }` (Nest standard) |
| IDs | CUID strings |

---

## Module index

| Module | Path | Doc |
|--------|------|-----|
| Overview | — | [api/overview.md](../api/overview.md) |
| Auth | `/auth` | [api/authentication.md](../api/authentication.md) |
| Users | `/users` | [api/users.md](../api/users.md) |
| Species | `/species` | [api/species.md](../api/species.md) |
| Plants | `/plants` | [api/plants.md](../api/plants.md) |
| Tasks | `/tasks` | [api/tasks.md](../api/tasks.md) |
| Dashboard | `/dashboard` | [api/dashboard.md](../api/dashboard.md) |
| Gardens | `/gardens` | [api/gardens.md](../api/gardens.md) |
| Community | `/community` | [api/community.md](../api/community.md) |
| Journal | `/plants/:plantId/journal` | [api/journal.md](../api/journal.md) |
| Diagnosis | `/plants/:id/diagnose*` | [api/diagnosis.md](../api/diagnosis.md) |
| Weather | `/users/me/weather` | [api/weather.md](../api/weather.md) |
| Billing | `/billing` | [api/billing.md](../api/billing.md) |
| Notifications | `/devices` | [api/notifications.md](../api/notifications.md) |
| Health & static | `/health`, assets | [api/health-and-static.md](../api/health-and-static.md) |

**Quick table:** [reference/routes-quick-reference.md](../reference/routes-quick-reference.md).

---

## Auth (`/auth`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Create account; may return `requiresVerification` |
| POST | `/login` | Access + refresh tokens |
| POST | `/refresh` | New access token |
| GET | `/verify-email/:token` | Confirm email |
| POST | `/resend-verification` | Resend email |
| POST | `/forgot-password` | Start reset flow |
| POST | `/reset-password` | Complete reset with token |

---

## Users (`/users`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/me` | Current user profile |
| PUT | `/me/onboarding` | Save or skip onboarding wizard |
| PUT | `/me/notification-settings` | Channels, quiet hours |
| DELETE | `/me` | Delete account |

Weather routes are under `/users/me/weather/*` — see [api/weather.md](../api/weather.md).

---

## Species (`/species`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/search?q=` | Search by name |
| GET | `/browse` | Paginated catalog + filters (beginner, light, etc.) |
| GET | `/recommended` | Personalized picks for user |
| GET | `/:id` | Species detail + enriched metadata |

---

## Plants (`/plants`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List user’s plants (and shared) |
| POST | `/` | Create plant → triggers task generation |
| GET | `/:id` | Detail (owner or shared read) |
| PATCH | `/:id` | Update → may reschedule tasks |
| DELETE | `/:id` | Remove plant |
| POST | `/identify` | PlantNet image identify |
| POST | `/upload` | Image upload |

---

## Tasks (`/tasks`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Query by date range, plant, status |
| PATCH | `/:id/complete` | Mark done |
| PATCH | `/:id/skip` | Skip with optional feedback body |
| PATCH | `/:id/snooze` | Snooze N days |
| GET | `/:id/instructions` | Care guide sections |
| GET | `/:id/explanation` | Why this due date |
| GET | `/schedule-suggestions` | Adaptive schedule proposals |
| POST | `/schedule-suggestions/:id/apply` | Apply one suggestion |

---

## Dashboard (`/dashboard`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Aggregated greeting, metrics, today tasks, attention, week preview, schedule suggestions, engagement |

Query: `from`, `to` (ISO dates) for task window.

---

## Gardens (`/gardens`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Create garden |
| GET | `/mine` | List gardens for user |
| POST | `/invites/accept` | Accept invite token |
| POST | `/:id/invites` | Invite by email |
| POST | `/:id/plants` | Share plant to garden |
| GET | `/:id/activity` | Activity feed |

---

## Community (`/community`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/posts` | List posts (`limit`) |
| POST | `/posts` | Create post |
| DELETE | `/posts/:id` | Delete own post |

---

## Journal (`/plants/:plantId/journal`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List entries |
| POST | `/` | Create |
| PATCH | `/:entryId` | Update |
| DELETE | `/:entryId` | Delete |

---

## Diagnosis

| Method | Path | Description |
|--------|------|-------------|
| POST | `/plants/:id/diagnose` | One-shot diagnosis |
| PATCH | `/plants/:id/diagnose/:diagnosisId` | Update notes/resolution |
| POST | `/plants/:id/diagnose/follow-up-task` | Schedule health check |
| GET/POST | `/plants/:plantId/diagnose/conversations` | Chat threads |
| POST | `.../conversations/:id/messages` | Send message |

---

## Internal services (no direct HTTP)

- **SchedulerService** — task CRUD side effects
- **CareGuidesService** — instruction assembly
- **EmailService** — transactional mail

---

## Testing the API

```bash
npm run verify
npm run test:integrations
```

Use Swagger or `scripts/verify.mjs` as living contract examples.

---

## Related

- [03 — Architecture](03-architecture-and-system-design.md)
- [09 — Integrations](09-integrations-and-external-services.md)
