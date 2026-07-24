# Phase 5 bounded read-path evidence

> **Date:** 2026-07-23
>
> **Main commit:** `f0c946d83c9f29e663605d3802da13951c974845`
>
> **State:** complete and deployed

## Side-effect-free read contracts

- `GET /dashboard`, `GET /plants`, and `GET /tasks` no longer invoke weather,
  recommendation, schedule, or milestone write maintenance.
- `GET /recommendations` lists persisted guidance without mutation.
  `POST /recommendations/refresh` is the explicit user action for regeneration
  and reactivation.
- Weather postponement runs after confirmed weather advice. Recommendation and
  milestone synchronization runs after the existing plant, task, progress, and
  diagnosis-related actions that earn the change.
- Unit tests assert that representative Prisma create, update, delete, and
  maintenance methods are not called by the read paths.

## Bounded dashboard contract

- Own and shared plants are capped at 100, gardens at 50, care tasks at 500,
  and recent journal/diagnosis history at five records per section.
- Prisma selects contain only fields rendered by the dashboard contract.
- The response includes `gardenSummaries`, and the web dashboard no longer
  performs a second garden-summary request.
- Request logs record response size from the final `Content-Length`.
- Query indexes cover the active dashboard, notification, recommendation,
  journal, diagnosis, garden task, and community visibility filters.

## PostgreSQL integration performance gate

[Required CI run 30055285248](https://github.com/James80401/PlantCare/actions/runs/30055285248)
passed both `test` and `postgres`. The PostgreSQL job deployed all migrations,
reported no schema diff, seeded deterministic empty, 10-plant, and 100-plant
accounts, and called the running API:

| Fixture | Response | First measured request |
|---|---:|---:|
| Empty | 3,336 bytes | 77.1 ms |
| 10 plants | 6,572 bytes | 29.8 ms |
| 100 plants | 36,110 bytes | 30.8 ms |

After warm-up, the 100-plant fixture measured **22.3 ms p95 across 20
requests**, below the 750 ms gate. Its 36,110-byte response is below the 250 KB
gate. Fixture records are deleted after the check even when the gate fails.

[Main CI run 30055670756](https://github.com/James80401/PlantCare/actions/runs/30055670756)
passed after merge. The exact main SHA then passed the automated production
deployment, migrations, readiness, and non-mutating sign-off in
[deploy run 30055808149](https://github.com/James80401/PlantCare/actions/runs/30055808149).

## Client request safety and local verification

- Dashboard requests abort on replacement/unmount, ignore stale responses, and
  retry one transient network/5xx failure.
- Prior dashboard data remains usable during a failed refresh and the user gets
  an explicit retry action.
- Recommendation generation requires the visible `Refresh guidance` action.
- `npm run verify:ci` passed locally with zero TypeScript errors, 441 API tests,
  195 web tests, production builds, production-configuration checks, media
  audit tests, documentation links, and private SEO guards.
- The dashboard calendar fixture passes in both Pacific local time and
  explicit `TZ=UTC`.
