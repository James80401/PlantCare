# Improvements roadmap baseline

> Captured: 2026-07-23  
> Repository commit: `02e11460fc3703ed183cfe7ef8f0b3f24a7c9449`

This is the reproducible starting point for the
[existing-systems improvement roadmap](improvements-roadmap.md). A result is
listed as verified only when it was run or inspected during the baseline pass.

## Tooling and repository

| Item | Baseline |
|---|---|
| Branch | `main`, aligned with `origin/main` |
| Local runtime | Node 24.13.0 / npm 11.6.2 |
| CI runtime | Node 20.20.2 |
| Required target | Node 22 (Capacitor 8 requires Node 22+) |
| Open pull requests/issues | None |
| Recent required CI | Red; final Buddy smoke calls a default-hidden API |
| Automated deploys | Four recorded failures; latest could not unlock the SSH key |

## Verification

| Check | Baseline |
|---|---|
| Full build | Pass |
| Web tests | 184/184 pass |
| API tests | 396/400 on Windows; timezone and POSIX-path assumptions explain four local failures |
| Linux CI API tests/build | Pass before Buddy smoke |
| Documentation links | 197 Markdown files pass |
| Private SEO guard | Pass |
| Web typecheck | 184 errors across 30 files (155 test, 29 application) |
| Production dependency audit | 21 findings: 1 critical, 9 high, 11 moderate |
| All dependency audit | 41 findings: 2 critical, 15 high, 20 moderate, 4 low |
| Android store preflight | 9/10; production API URL missing |
| Push preflight | 4/5; server FCM configuration missing |

## Production probes

| Probe | Baseline |
|---|---|
| Web and API health/readiness | HTTP 200; database/uploads ready |
| CORS | Expected production web origin allowed |
| Web indexing | Private/noindex, empty sitemap |
| Web security headers | Missing CSP, HSTS, frame, content-type, and referrer headers |
| API security headers | Helmet headers present |
| Swagger | Public HTTP 200 in production |
| Legal pages | Live but still identify themselves as templates |

## Feature state

| System | State |
|---|---|
| Gardens, plants, tasks, calendar | Active |
| Journal, progress, milestones | Active |
| Diagnosis and per-plant Dr. Plant chat | Active; requires OpenAI credentials |
| Recommendations and weather guidance | Active |
| Sharing/household/community | Active |
| Admin registration and observability | Active |
| Plant Buddy | Gated off by default |
| Paid Premium/Stripe UI | Gated/partial |
| Push/SMS | Partial; native pieces exist, production server configuration incomplete |
| Android | Partial; native project exists, closed testing incomplete |
| Public marketing/indexing | Gated/private |

## Highest-risk implementation facts

- API startup performs PostgreSQL `db push --accept-data-loss` and seeds on every
  container start.
- Checked-in Prisma migrations are SQLite migrations.
- Dashboard/plant/task GET requests can mutate schedules; dashboard GET also
  refreshes recommendations and milestones.
- Reminder selection includes a two-day range for “due today” and uses the
  server day before checking user-local reminder hour.
- Missing/failing notification transports can still be logged and marked as
  successfully notified.
- Browser access and refresh tokens persist in local storage; concurrent 401s
  each initiate refresh and failure clears the entire origin storage.
- Production Compose omits supported FCM, Twilio, reminder-email, Sentry, and
  several feature/configuration values.
- Local media replacement/deletion is incomplete, and configured `S3_PUBLIC_URL`
  changes returned URLs without uploading objects.
- The largest core UI containers and API services mix orchestration, data,
  interaction, and presentation concerns.

Update this file only with dated follow-up sections; do not overwrite the
baseline.
