# Phase 6 existing-UX implementation evidence

> **Date:** 2026-07-23
>
> **Candidate branch:** `codex/phase-6-existing-ux`
>
> **State:** implementation and automated verification complete

## Reliability and consistency

- Add Plant uses a client request UUID enforced by the database, returns the
  existing plant on same-key retries, handles concurrent uniqueness races, and
  retains a failed photo for explicit retry.
- Dr. Plant keeps drafts/uploads after failure, reuses the same request ID for
  a retry, rejects stale responses, and resets state at plant boundaries.
- Task complete, bulk-complete, skip, and snooze failures reload authoritative
  server state and surface an explicit restored-state message across task
  surfaces.
- Journal saves are single-flight, preserve the editor during failures, await
  the authoritative reload, and report delete failures.

## Household and community correctness

- Invite acceptance atomically claims a pending invite and is idempotent for
  the accepting user. Repeated member removal is a no-op without duplicate
  activity.
- Owner, caregiver, viewer, invitee, removed-member, and cross-account task
  authorization are covered by the task-access matrix.
- Community pagination uses the stable `(createdAt, id)` cursor order.
- Like/follow/block toggles converge under uniqueness/delete races, and the web
  disables repeated optimistic actions until the request settles.
- Hidden or blocked originals cannot reappear through reshares, comments, or
  likes; comments by blocked authors are filtered.

## Catalog and navigation

- The two final catalog images use exact reusable Wikimedia Commons sources:
  Hoya Mathilde is public domain; String of Dolphins is CC BY-SA 4.0.
- The photo manifest, local files, and generated attribution record all 447
  species. Missing-photo and license audits report zero gaps.
- Login and registration no longer offer a “Back to home” path that loops back
  into the private login gate. The existing optional Quick Tour remains.

## Verification

Focused API suites for community, gardens, task authorization, and plant
idempotency pass. Focused web suites for Add Plant, Dr. Plant, task rollback,
and the refactored helpers pass.

The complete local gate also passes:

- `npm run verify:ci`: zero TypeScript errors, 461 API tests, 203 web tests,
  shared/API/web builds, production-configuration checks, media-audit tests,
  documentation links, and private-indexing guards.
- Playwright: 48 desktop/mobile scenarios passed. Four intentional
  environment/feature skips remain: Buddy is disabled in both projects and
  the SMTP-dependent reset flow is skipped in both projects when SMTP is not
  configured.
- Species catalog: 447 entries; 447 reusable manifest entries and local photo
  files; zero restricted, unclear, missing, or unlicensed entries.
- `npm audit --audit-level=high`: zero vulnerabilities.
- [Candidate CI run 30063024797](https://github.com/James80401/PlantCare/actions/runs/30063024797):
  `test`, `postgres`, `e2e`, and `android` all passed. The E2E job ran the same
  48 enabled scenarios against a clean CI database; the Android job produced an
  unsigned release bundle with Java 21.
- [Protected-main CI run 30063415020](https://github.com/James80401/PlantCare/actions/runs/30063415020)
  repeated all four required jobs successfully for merge commit `6bcdd78`.

The grouped task experience now exposes the existing care-instruction and
schedule-explanation dialogs through its Details disclosure; desktop and
mobile E2E prove both dialogs and snooze behavior.
