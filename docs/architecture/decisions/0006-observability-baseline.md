# ADR-0006 — On-box observability baseline, optional Sentry

> **Navigation:** [ADR INDEX](INDEX.md) · [Observability](../../operations/observability.md)

**Status:** Accepted · **Date:** 2026-06

## Context

The API had no observability beyond ad-hoc `Logger` calls: no request correlation, no
structured logs, no error aggregation, and a `/health` that didn't check dependencies
(addressed separately in [ADR-0005](0005-readiness-vs-liveness.md)). A production 500
vanished into stdout with no way to correlate it to a user report or capture its stack.

Constraints shaping the choice:

- **Single VPS, privacy-conscious private beta.** Shipping all telemetry to a SaaS by
  default is undesirable; data should stay on-box unless an operator opts in.
- **Existing error contracts.** The frontend depends on specific HttpException bodies
  (`DR_PLANT_SCOPE_REQUIRED`, `AI_USAGE_PAUSED`, `PLANT_LIMIT_REACHED`,
  `IDENTIFY_LIMIT_REACHED`). Any global error handling must not change response shapes.
- **No appetite for a heavy logging framework** or a global logger swap that reformats
  every existing `Logger` call site.

## Decision

A dependency-free, on-box baseline, with Sentry as an opt-in:

1. **Request ids** — plain Express middleware adds/propagates `x-request-id`, echoed in
   responses and attached to logs.
2. **Structured access logs** — `res.on('finish')` middleware emits one JSON line per
   request (true final status + duration). Chosen over a Nest interceptor to avoid the
   rxjs pipeline and capture every response uniformly.
3. **Global exception filter** — single error boundary that *preserves* HttpException
   bodies verbatim, maps unknown errors to a no-leak generic 500, logs structured error
   lines, and reports 5xx to Sentry.
4. **Optional Sentry** — `SENTRY_DSN`-gated, lazily importing `@sentry/node` so there is
   no hard dependency; a no-op when unset or uninstalled.

Logs are emitted as JSON strings via the existing Nest `Logger`, matching the
`image_moderation_reject` convention already in the codebase — no logger framework, no
call-site churn.

## Consequences

- Full correlation + structured logs + error capture with **zero new required
  dependencies**; everything works on a single box and ships to any aggregator.
- Sentry is a one-command opt-in (`npm i @sentry/node` + `SENTRY_DSN`) for teams that
  want hosted error tracking; off by default keeps data on-box.
- Logs go to stdout as JSON-in-message lines. If a future need arises for first-class
  structured logging (nested fields, log levels per module), revisit with `nestjs-pino`
  — but that is a global logger change, deliberately deferred.
- Access logging via Express middleware (not a Nest interceptor) means it sits outside
  Nest's DI/interceptor chain; that's intentional and keeps it framework-light.
