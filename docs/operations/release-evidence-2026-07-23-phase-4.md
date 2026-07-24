# Phase 4 notification, billing, and AI evidence

> **Date:** 2026-07-23
>
> **Production release:** `d5c6665`
>
> **State:** complete; notification providers remain capability-gated and paid billing remains disabled

## Notification delivery truth

- Reminder email uses the existing SMTP service, while production Compose passes
  complete SMTP, FCM, and Twilio credential sets without treating partial or
  missing configuration as delivery.
- Reminder selection uses the user's local calendar day and reminder hour,
  including deterministic timezone fallback and DST behavior. Due today,
  tomorrow, and overdue use the same local boundary.
- Per-channel notification logs retain dedupe keys, related entities, attempts,
  provider/error details, and honest `sent`, `failed`, `skipped`, or
  `unconfigured` status. Successful channels are not repeated when failed
  channels retry.
- Invalid push tokens are removed and current notification capabilities are
  returned to Settings and existing admin observability.
- [CI run 30052413918](https://github.com/James80401/PlantCare/actions/runs/30052413918)
  and [deploy run 30052571226](https://github.com/James80401/PlantCare/actions/runs/30052571226)
  passed.

## Billing gate and Stripe lifecycle

- API and web Premium gates must agree, and production configuration checks
  require both to remain disabled during this roadmap.
- Invalid signatures fail, repeated subscription events are idempotent, and
  payment failure, trial, active, cancellation, portal return, and
  account-deletion cancellation paths are covered.
- [CI run 30053071583](https://github.com/James80401/PlantCare/actions/runs/30053071583)
  and [deploy run 30053239728](https://github.com/James80401/PlantCare/actions/runs/30053239728)
  passed.

## AI reliability and accounting

- Diagnosis, Dr. Plant chat, progress analysis, and moderation share bounded
  OpenAI timeouts and transient retries.
- Usage records distinguish reserved, succeeded, failed, and fallback outcomes;
  failed provider calls do not count as successful usage.
- Quota and rate-limit errors retain their authoritative codes. Rules fallback
  is limited to allowed transient failures and every response retains an
  authoritative source.
- Images are moderated before diagnosis providers. Dr. Plant retries use a
  client request ID, persist only after provider success, and clean failed
  uploads so retries cannot create duplicate messages or orphan media.
- Existing admin AI metrics expose provider outcomes and usage totals.
- [PR CI run 30054157470](https://github.com/James80401/PlantCare/actions/runs/30054157470),
  [main CI run 30054307158](https://github.com/James80401/PlantCare/actions/runs/30054307158),
  and [deploy run 30054448433](https://github.com/James80401/PlantCare/actions/runs/30054448433)
  passed.

## Gate state

- Buddy remains disabled by default and is exercised only by its enabled
  contract smoke.
- Paid Premium billing remains disabled in both API and web production
  configuration.
- Provider-dependent notification channels remain unavailable in the client
  unless their existing server integration is completely configured.
