# ADR-0001 — Image moderation fails open

> **Navigation:** [ADR INDEX](INDEX.md) · [AI image pipeline](../ai-pipeline.md)

**Status:** Accepted · **Date:** 2026-06

## Context

Every image upload is screened by an OpenAI vision call
([`ImageModerationService`](../../../apps/api/src/common/image-moderation.service.ts))
that decides `isPlant` / `isExplicit`. That call is a network dependency on a
third-party API with its own rate limits, outages, and latency. The app's core loop —
adding and diagnosing plants — depends on uploading photos.

Two failure philosophies:

- **Fail closed:** if moderation can't run, reject the upload. Maximizes safety,
  but a moderation outage (or an unset API key in some environment) takes down the
  entire photo feature for every user.
- **Fail open:** if moderation can't run, allow the upload. Keeps the product working
  during a moderation outage, at the cost of letting unscreened images through during
  that window.

## Decision

**Fail open.** When the API key is missing, the request errors, or the response is
unparseable, `classify` returns an allow verdict. Every fail-open branch is logged
loudly (`error`/`warn`) so the condition is visible in monitoring.

## Consequences

- A moderation outage degrades to "no screening" rather than "no uploads." For a
  plant-care app (not a social network), unscreened images during a rare outage is a
  far smaller harm than a broken core feature.
- Operators **must** monitor the fail-open logs; sustained fail-open means moderation
  is silently off. See the `image_moderation_reject` and moderation-error logs in
  [AI image pipeline](../ai-pipeline.md).
- If the product later adds public image sharing at scale, revisit — a fail-closed
  posture (or a cheap local pre-filter) may become worth the availability cost.
