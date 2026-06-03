# ADR-0005 — Separate readiness and liveness health checks

> **Navigation:** [ADR INDEX](INDEX.md) · [Deployment](../../operations/deployment.md)

**Status:** Accepted · **Date:** 2026-06

## Context

The original `GET /health` returned `{status:'ok'}` without touching any dependency.
Docker Compose used it for the `depends_on: service_healthy` condition that gates the
web container's startup. The problem: that probe passes even when Postgres is
unreachable, so a broken API instance is still marked healthy and continues to receive
traffic and gate dependents.

A single endpoint can't serve both needs well:

- **Liveness** must be cheap and dependency-free — an orchestrator uses it to decide
  whether to *restart* the process. If it checks the DB, a DB blip triggers pointless
  restarts.
- **Readiness** must reflect real ability to serve — used to decide whether to *route
  traffic*. It should check dependencies.

## Decision

Split them ([`health.controller.ts`](../../../apps/api/src/health.controller.ts)):

- `GET /health` — liveness, unchanged, no dependencies.
- `GET /health/ready` — readiness: runs `SELECT 1` and checks upload-dir writability,
  returns **503** with per-check detail when anything fails.

Docker Compose healthchecks (which gate `depends_on`) now point at `/health/ready`.

## Consequences

- A process with a dead DB connection is pulled out of rotation / fails the dependency
  gate instead of silently serving errors.
- Liveness stays cheap, so transient DB issues don't cause restart storms.
- Adds two lightweight checks to the readiness path; negligible cost at the probe
  interval. Extend `ready()` as new critical dependencies (e.g. Redis) are added.
