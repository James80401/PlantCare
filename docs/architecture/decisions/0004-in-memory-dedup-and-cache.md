# ADR-0004 — In-memory dedup + TTL cache (single-instance)

> **Navigation:** [ADR INDEX](INDEX.md) · [Scheduling](../scheduling.md)

**Status:** Accepted · **Date:** 2026-05/06

## Context

Two hot paths benefit from caching:

1. **Weather postponement** ([`SchedulerService`](../../../apps/api/src/scheduler/scheduler.service.ts))
   was being invoked from three places per dashboard load. It only needs to run once
   per user per day.
2. **Species catalog** ([`PerenualService`](../../../apps/api/src/species/perenual.service.ts))
   is effectively static but was re-read from the DB on every browse/filter/detail.

The deployment today is a **single API instance** behind a reverse proxy (see
[deployment](../../operations/deployment.md)). A shared cache store (Redis) would add
an operational dependency that isn't yet justified.

## Decision

Use **process-local in-memory** structures:

- A `Map<userId, dayKey>` to dedupe weather postponement to once-per-user-per-day,
  with a daily sweep that drops stale entries so it can't grow unbounded.
- A small generic [`TtlCache`](../../../apps/api/src/common/ttl-cache.ts) (5-min TTL)
  for the full species catalog and per-id lookups, invalidated on catalog upsert.

## Consequences

- Zero new infrastructure; immediate win on the single instance.
- **Does not survive horizontal scaling.** With N replicas, each holds its own copy:
  weather postponement could run up to N times/day, and cache hit rates drop. That's
  correct (idempotent) but less efficient.
- **Migration trigger:** the day a second API replica is added, move both to Redis
  (or a shared cache) — the `TtlCache` interface (`getOrSet`/`clear`) is intentionally
  small to make that swap mechanical.
