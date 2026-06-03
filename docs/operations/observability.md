# Observability

> **Navigation:** [Operations INDEX](INDEX.md) · [AI cost & usage](ai-cost-and-usage.md) · [Deployment](deployment.md)

How to see what the API is doing in production: correlation ids, structured logs, error
capture, and the optional Sentry integration. All on-box by default — no SaaS required.

---

## Correlation ids

Every request gets an `x-request-id`
([`request-id.middleware.ts`](../../apps/api/src/observability/request-id.middleware.ts)):

- An inbound `x-request-id` (≤128 chars) is honoured so a reverse proxy or client can
  propagate a trace id; otherwise a UUID is generated.
- The id is echoed in the **response header** and attached to every log line for that
  request, so a user-reported error ("request id abc-123 failed") maps straight to the
  server logs.

## Structured logs

Two structured, single-line-JSON log streams (greppable, ship to any aggregator):

| Event | Source | Level | When |
|-------|--------|-------|------|
| `http_request` | [`access-log.middleware.ts`](../../apps/api/src/observability/access-log.middleware.ts) | `log` (5xx → `error`) | every request, on response finish |
| `request_error` | [`all-exceptions.filter.ts`](../../apps/api/src/observability/all-exceptions.filter.ts) | `warn` (4xx) / `error` (5xx) | any thrown exception |
| `image_moderation_reject` | [`image-moderation.service.ts`](../../apps/api/src/common/image-moderation.service.ts) | `warn` | a photo is rejected |

Each carries `requestId`, and `http_request` / `request_error` also include `method`,
`path`, `statusCode`, and `userId` (when authenticated). Access logs skip
`/api/v1/health*` to avoid probe spam.

Example:
```json
{"event":"http_request","requestId":"…","method":"POST","path":"/api/v1/plants/identify","statusCode":201,"durationMs":842,"userId":"…"}
{"event":"request_error","requestId":"…","method":"POST","path":"/api/v1/auth/login","statusCode":401,"message":"Invalid credentials"}
```

> **Querying:** with a JSON-aware log shipper, filter on `event` and `statusCode`.
> Plain text works too — `grep request_error | grep '"statusCode":5'` for server faults.

## The exception filter

[`AllExceptionsFilter`](../../apps/api/src/observability/all-exceptions.filter.ts) is
the single global error boundary. It is **shape-preserving**:

- `HttpException` → status and body pass through verbatim, so the custom payloads the
  frontend relies on (`DR_PLANT_SCOPE_REQUIRED`, `AI_USAGE_PAUSED`,
  `PLANT_LIMIT_REACHED`, `IDENTIFY_LIMIT_REACHED`, validation errors) are unchanged.
- Anything else → a generic `500 { statusCode, message:'Internal server error',
  requestId }`. Internal messages/stacks are **never** sent to the client; the stack is
  logged server-side and reported to Sentry.

---

## Optional Sentry

Error reporting via Sentry is **off unless `SENTRY_DSN` is set**, mirroring the app's
other optional integrations. [`sentry.ts`](../../apps/api/src/observability/sentry.ts)
declares no hard dependency — it loads `@sentry/node` lazily, so the build and runtime
work without it.

Enable in production:

```bash
npm i @sentry/node --workspace @plant-care/api
# then set in the API environment:
SENTRY_DSN=https://…@…ingest.sentry.io/…
# optional:
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0
```

Only **5xx and unhandled** errors are reported (4xx client errors are not), each tagged
with `requestId` and `userId`. If `SENTRY_DSN` is set but the package isn't installed,
the API logs a one-time warning and continues — it never fails to boot over telemetry.

See [ADR-0006](../architecture/decisions/0006-observability-baseline.md) for the design
rationale.

---

## What to watch

| Signal | Where | Meaning |
|--------|-------|---------|
| Spike in `request_error` 5xx | logs / Sentry | server fault — investigate by `requestId` |
| Sustained `image_moderation_*` errors (fail-open) | logs | moderation silently degraded — check `OPENAI_API_KEY` |
| `RATE_LIMITED` / `PAUSED` rows | `AiUsageEvent` table | AI abuse or a limit set too low — see [AI cost & usage](ai-cost-and-usage.md) |
| `/health/ready` returning 503 | probe | DB or upload dir unavailable — see [deployment](deployment.md) |

---

## Configuration

| Variable | Default | Effect |
|----------|---------|--------|
| `SENTRY_DSN` | — | Enables Sentry error reporting. Unset ⇒ fully no-op. |
| `SENTRY_ENVIRONMENT` | `NODE_ENV` | Environment tag in Sentry. |
| `SENTRY_TRACES_SAMPLE_RATE` | `0` | Performance-trace sampling (0 = errors only). |

---

## Testing

`all-exceptions.filter.spec.ts` (body preservation, 500 mapping, no-leak) and
`request-id.middleware.spec.ts` (generation, propagation, anti-injection).
