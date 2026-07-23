# Dr. Plant existing-systems improvement roadmap

> **Status:** canonical execution roadmap  
> **Started:** 2026-07-23  
> **Owner:** James80401  
> **Guardrail:** improve existing product and operational systems only; do not
> add new product modules, services, queues, analytics vendors, state
> frameworks, or redesigns.

This roadmap supersedes the older implementation checklists as the source of
truth for current work. Historical plans remain useful design context, but
their checkboxes are not current status.

Supporting evidence:

- [Implementation baseline](improvements-roadmap-baseline.md)
- [Release evidence template](../operations/release-evidence-template.md)
- [UAT checklist](uat-checklist.md)

## Current execution status

| Phase | State | Evidence |
|---|---|---|
| 0 - source of truth | Complete | Canonical roadmap, baseline, and release-evidence template committed in `94dc86c`. |
| 1 - engineering truth | Complete | Commit `50df663`: [CI run 30042439894](https://github.com/James80401/PlantCare/actions/runs/30042439894) passed `test` and `postgres`; both checks are required on protected `main`. Local clean install, zero-error typecheck, 400 API tests, 184 web tests, builds, docs, private SEO, Docker builds, and zero-vulnerability audit also pass. |
| 2 - data and deployment safety | In progress | PostgreSQL migration history, deployment, backup, rollback, and restore-drill work is active. |
| 3-8 | Queued | Work begins only after the preceding release-safety gate is recorded. |

## Release policy

Release safety leads the work. Buddy, paid Premium, public indexing/marketing,
and other gated functionality remain disabled while their existing contracts
and tests are hardened.

Public activation is blocked until required CI is green, TypeScript reports
zero errors, PostgreSQL migrations and rollback are proven, a backup restore is
verified, critical security findings are resolved, legal content is approved,
desktop/mobile E2E and accessibility checks pass, and production sign-off is
non-mutating and recorded.

## Execution phases

### Phase 0 - one source of truth

- Maintain this file as the sole current roadmap.
- Record reproducible tooling, test, audit, feature-flag, mobile, and production
  baselines.
- Use the release-evidence template for migrations, restore drills, mobile
  checks, deploys, and sign-off.

Exit: every existing feature is classified as active, gated, partial, or
deferred, and unverified work is never marked complete.

### Phase 1 - engineering truth and green CI

- Standardize Node 22 across package metadata, CI, Docker, and mobile tooling.
- Use lockfile-enforced `npm ci`.
- Add root typecheck and unified verification commands; fix every application
  and test type error.
- Make timezone and filesystem tests platform-independent.
- Test Buddy twice: hidden by default and explicitly enabled in its own smoke.
- Add PostgreSQL CI coverage while retaining useful fast SQLite tests.
- Remediate dependencies in controlled groups and require green CI on `main`.

Exit: typecheck, API/web tests, builds, documentation, private SEO, PostgreSQL,
and feature-aware smoke checks pass without ignored required steps.

### Phase 2 - PostgreSQL, backups, and deployment

- Give PostgreSQL its own schema-adjacent migration history and generate a
  verified baseline.
- Validate fresh-database deploy and current-schema reconciliation.
- Replace container `db push --accept-data-loss` with `prisma migrate deploy`.
- Move idempotent catalog seeding into the explicit deploy workflow.
- Deploy the exact CI-tested commit with preflight, backup, migration, readiness,
  live probes, and automatic application rollback.
- Pass all supported integration configuration into Compose, remove insecure
  database defaults, honor configured health-check values, and bound logs.
- Keep production sign-off non-mutating and prove a full database/uploads
  restore.

Exit: fresh and existing PostgreSQL paths pass; startup never uses `db push`;
one workflow deploy, rollback, and restore drill are recorded.

### Phase 3 - authentication, security, legal truth, and media

- Move refresh authentication to secure HttpOnly cookies and keep access tokens
  in memory.
- Add credentialed web/native requests, strict allowed-origin validation,
  single-flight refresh, and scoped client storage cleanup.
- Add compatible web security headers and disable production Swagger by
  default.
- Replace raw request bodies with validated DTOs.
- Verify and normalize image contents, strip metadata, and use safe extensions.
- Require verified legal contact/retention configuration and password-confirmed
  account deletion.
- Revoke sessions, stop active billing, and remove all managed user media on
  deletion.
- Audit and clean orphaned local media; remove misleading unimplemented S3
  behavior.

Exit: refresh tokens are unavailable to browser JavaScript, web/native reload
works, production headers pass, Swagger is hidden, and media lifecycle tests
leave no managed orphans.

### Phase 4 - notifications, billing, and AI integrations

- Consolidate reminder email on the existing SMTP service.
- Calculate reminder windows in each user's local timezone and distinguish
  today, tomorrow, and overdue correctly.
- Extend notification logs with dedupe, entity, real delivery status, provider
  result, error, and attempt time.
- Retry failed channels without duplicating successful delivery and expose
  configured capabilities in Settings/admin.
- Gate billing on both API and web; harden Stripe signature, idempotency, payment
  failure, cancellation, and account-deletion behavior.
- Standardize AI timeouts/retries, record real outcomes, preserve quota errors,
  expose authoritative source, moderate before provider calls, and make retry
  idempotent.

Exit: timezone/DST, partial failure, retry/dedupe, billing, and AI accounting
regressions pass while Buddy and billing remain gated.

### Phase 5 - bounded, side-effect-free reads

- Remove writes from dashboard, plant, task, and recommendation GET paths.
- Run weather, recommendation, and milestone mutations from explicit existing
  workflows.
- Make recommendation listing read-only and add an explicit refresh action.
- Bound and slim dashboard selects; include garden summaries and remove the
  duplicate client request.
- Add query indexes, response-size logging, performance fixtures, cancellation,
  and stale-response protection.

Exit: read endpoints issue no writes; the 100-plant dashboard is at most 250 KB
and below 750 ms p95 in staging.

### Phase 6 - consistent existing UX

- Split oversized dashboard, Dr. Plant, journal, and admin containers into their
  existing domain sections and hooks.
- Unify task actions and rollback behavior across every task surface.
- Preserve Add Plant, Dr. Plant, and journal drafts/uploads through failures and
  prevent retry duplicates.
- Complete household permission matrices and community concurrency, pagination,
  moderation, reshare, and media cleanup.
- Remove private-entry navigation loops, keep Quick Tour optional, and complete
  catalog photo/source checks.

Exit: existing routes and capabilities remain intact and core desktop/mobile
E2E plus cross-account permission tests pass.

### Phase 7 - accessibility and Android

- Upgrade the existing dialog hook with focus trap, restore, Escape, background
  isolation, and nested/required-dialog behavior.
- Apply it consistently and add automated route/dialog/form/reduced-motion
  checks.
- Complete the existing viewport, 200% zoom, keyboard, and screen-reader matrix.
- Bake the production API URL into Android, allow native CORS/cookies, configure
  FCM, increment the release version, and complete signed closed-test install
  verification.
- Keep default Buddy UI/API hidden and retain a separate enabled regression.

Exit: accessibility evidence is recorded, store check is 10/10, push preflight
is 5/5, and the closed-test core scenario passes.

### Phase 8 - visibility, documentation, and sign-off

- Make the existing optional Sentry path buildable and truthful.
- Expand existing admin observability with activation, notification, AI, backup,
  and deployed-version evidence already available from current data.
- Standardize current client event names without adding an analytics provider.
- Add release checks for dependencies, image licenses, docs, migrations, flags,
  security headers, and application version.
- Reconcile all active documentation and run the complete clean-checkout,
  migration, restore, test, mobile, deploy, and non-mutating production gate.

Exit: the release evidence is complete. Public indexing, Buddy, and billing
remain disabled pending separate explicit activation decisions.

## Compatibility decisions

- Auth uses a two-step rollout: the server temporarily accepts the legacy
  refresh-token body while setting cookies, then removes the body/response token
  after updated web/native clients are verified.
- `GET /recommendations` becomes read-only; `POST /recommendations/refresh`
  performs generation/reactivation.
- The dashboard adds bounded `gardenSummaries`; existing consumed fields remain
  for one compatibility release.
- PostgreSQL schema changes use expand/contract releases so application rollback
  remains safe.
- Android closed testing is the native target. iOS compatibility is preserved,
  but an iOS store launch is outside this roadmap.
- Local upload storage and verified backups remain canonical; object storage is
  not added.

## Execution status

| Phase | Status | Evidence |
|---|---|---|
| 0 | In progress | Baseline and release-evidence documents created |
| 1 | Pending | |
| 2 | Pending | |
| 3 | Pending | |
| 4 | Pending | |
| 5 | Pending | |
| 6 | Pending | |
| 7 | Pending | |
| 8 | Pending | |
