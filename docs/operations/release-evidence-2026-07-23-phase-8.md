# Phase 8 observability and release implementation evidence

> **Date:** 2026-07-23
>
> **Candidate branch:** `codex/phase-6-existing-ux`
>
> **State:** implementation and local release gates complete; CI/deploy pending

## Operational visibility

- `@sentry/node` is a declared, build-verified runtime dependency. Sentry is a
  truthful no-op without a DSN and records environment/release when enabled.
- Existing admin observability now reports approved users, users with a garden,
  users with a plant, first task completion, and first diagnosis/Dr. Plant
  engagement from current database records.
- Admin and readiness status expose the application version and commit without
  exposing secrets.
- Existing client event names use one snake_case convention and duplicate
  signup emission was removed. No analytics provider was added.

## Release checks

- Root, API, and web packages identify release `1.1.0`; Android identifies
  `1.1 (2)`.
- Production configuration requires a non-placeholder semantic application
  version. Exact-SHA deploy and rollback export the version from that checkout.
- Production sign-off rejects a placeholder version.
- CI retains dependency, migration/schema-diff, docs, private-indexing, media,
  feature-gate, and PostgreSQL performance checks and adds an Android
  release-bundle job.

## Remaining final evidence

- Local release evidence is green: `verify:ci` passes with 460 API and 202 web
  tests, desktop/mobile Playwright passes 48 enabled scenarios, the dependency
  audit reports zero vulnerabilities, documentation links pass, Android
  release build/sync passes, store preflight passes 10/10, and catalog/license
  verification passes.
- Record the branch/main CI result, PostgreSQL migration rehearsal, Java 21
  Android bundle result, exact-SHA production deployment, and non-mutating
  live sign-off.
- Legal approval, FCM credentials, the signed closed-track device scenario, and
  the manual accessibility matrix remain explicit release blockers and are not
  represented as complete.
