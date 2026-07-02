# Routes quick reference

> **Navigation:** [Reference INDEX](INDEX.md) · [API INDEX](../api/INDEX.md) · [Web routing](../web/routing.md)

**API base:** `/api/v1`

## Auth

| Method | Path |
|--------|------|
| POST | `/auth/register` |
| POST | `/auth/login` |
| POST | `/auth/refresh` |
| GET | `/auth/verify-email/:token` |
| POST | `/auth/resend-verification` |
| POST | `/auth/forgot-password` |
| POST | `/auth/reset-password` |

## Users

| Method | Path |
|--------|------|
| GET | `/users/me` |
| PUT | `/users/me/care-preferences` |
| PUT | `/users/me/notification-settings` |
| DELETE | `/users/me` |

## Weather (under users)

| Method | Path |
|--------|------|
| GET | `/users/me/weather` |
| GET | `/users/me/weather/status` |
| POST | `/users/me/weather/advice` |
| GET | `/users/me/weather/plants/:plantId/advice` |

See [api/weather.md](../api/weather.md).

## Species

| Method | Path |
|--------|------|
| GET | `/species/search?q=` |
| GET | `/species/browse` |
| GET | `/species/recommended` |
| GET | `/species/:id` |

## Plants

| Method | Path |
|--------|------|
| GET | `/plants` |
| POST | `/plants` |
| GET | `/plants/:id` |
| PATCH | `/plants/:id` |
| DELETE | `/plants/:id` |
| POST | `/plants/identify` |
| POST | `/plants/upload` |

## Tasks

| Method | Path |
|--------|------|
| GET | `/tasks` |
| PATCH | `/tasks/:id/complete` |
| PATCH | `/tasks/:id/skip` |
| PATCH | `/tasks/:id/snooze` |
| GET | `/tasks/:id/instructions` |
| GET | `/tasks/:id/explanation` |
| GET | `/tasks/schedule-suggestions` |
| POST | `/tasks/schedule-suggestions/:id/apply` |
| GET | `/recommendations` |
| PATCH | `/recommendations/:id/done` |
| PATCH | `/recommendations/:id/snooze` |
| PATCH | `/recommendations/:id/dismiss` |
| POST | `/recommendations/:id/task` |

## Dashboard

| Method | Path |
|--------|------|
| GET | `/dashboard?from=&to=` |

## Gardens

| Method | Path |
|--------|------|
| POST | `/gardens` |
| GET | `/gardens/mine` |
| POST | `/gardens/invites/accept` |
| POST | `/gardens/:id/invites` |
| POST | `/gardens/:id/plants` |
| GET | `/gardens/:id/activity` |

## Community

| Method | Path |
|--------|------|
| GET | `/community/posts` |
| POST | `/community/posts` |
| DELETE | `/community/posts/:id` |

## Diagnosis

| Method | Path |
|--------|------|
| POST | `/plants/:id/diagnose` |
| PATCH | `/plants/:id/diagnose/:diagnosisId` |
| POST | `/plants/:id/diagnose/follow-up-task` |
| GET | `/plants/:plantId/diagnose/conversations` |
| POST | `/plants/:plantId/diagnose/conversations` |
| GET | `/plants/:plantId/diagnose/conversations/:id` |
| POST | `/plants/:plantId/diagnose/conversations/:id/messages` |

## Journal

| Method | Path |
|--------|------|
| GET | `/plants/:plantId/journal` |
| POST | `/plants/:plantId/journal` |
| PATCH | `/plants/:plantId/journal/:entryId` |
| DELETE | `/plants/:plantId/journal/:entryId` |

## Billing & devices

| Method | Path |
|--------|------|
| POST | `/billing/checkout` |
| POST | `/billing/webhook` |
| POST | `/devices` |

## Health & static

| Method | Path |
|--------|------|
| GET | `/health` |
| GET | `/care-guides/images/*` |
| GET | `/care-guides/photos/*` |
| GET | `/uploads/*` |

## Web routes

See [web/routing.md](../web/routing.md).
