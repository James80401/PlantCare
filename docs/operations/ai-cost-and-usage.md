# AI cost & usage controls

> **Navigation:** [Operations INDEX](INDEX.md) · [AI image pipeline](../architecture/ai-pipeline.md) · [Integrations: OpenAI](../integrations/openai.md)

The OpenAI-backed surfaces (Dr. Plant chat, one-shot diagnosis, image moderation) are
the only metered, billable paths in the app. This doc covers the guardrails that keep
spend bounded and the data you can query to monitor it.

Implementation: [`AiUsageService`](../../apps/api/src/ai-usage/ai-usage.service.ts).

---

## Three layers of control

```
request → [scope gate] → [rate/abuse gate] → [model call] → [usage row]
            assertPlantIntentOrThrow   reserveCall      …          AiUsageEvent
```

### 1. Scope gate — `assertPlantIntentOrThrow`
Stops the AI being used as a free general-purpose GPT. Classifies the message:

- **Allowed** when: an image is attached (and no strong off-topic signal), the text is
  empty, the text contains plant vocabulary (`PLANT_TERMS`), it matches a contextual
  phrase ("what is wrong", "brown spots", …), or it's a short pronoun-y follow-up
  ("is it dying?").
- **Blocked** when: it matches an off-topic pattern (code, homework, crypto, résumés,
  "write a poem", …) or simply never mentions plants.

A block records a `BLOCKED_OFF_TOPIC` event and returns **400 `DR_PLANT_SCOPE_REQUIRED`**.

### 2. Rate / abuse gate — `reserveCall`
Per-user sliding-window limiter, checked immediately before each billable model call:

- Counts `ALLOWED` events in the last `AI_RATE_LIMIT_WINDOW_MINUTES` (default 60).
- At `AI_RATE_LIMIT_MAX_CALLS` (default 30), the account is **paused**: `User.aiPausedUntil`
  is set to `now + AI_RATE_LIMIT_PAUSE_HOURS` (default 12h), a `RATE_LIMITED` event is
  recorded, and the call returns **429 `AI_USAGE_PAUSED`**.
- While paused, every attempt records a `PAUSED` event and returns 429 with the
  `pausedUntil` timestamp.
- Otherwise records an `ALLOWED` event and proceeds.

### 3. Image moderation
A separate billable vision call gates *image* content (is-plant / is-explicit). It is
documented in [AI image pipeline](../architecture/ai-pipeline.md) and fails open.

---

## The `AiUsageEvent` table

Every gate decision writes a row ([model](../database/schema-reference.md)):

| Column | Notes |
|--------|-------|
| `userId` | indexed with `createdAt` |
| `feature` | `diagnosis`, `diagnosis_chat`, or `admin` |
| `plantId`, `conversationId` | optional context |
| `promptChars`, `imageCount` | rough cost proxies |
| `status` | `ALLOWED` · `BLOCKED_OFF_TOPIC` · `RATE_LIMITED` · `PAUSED` · `ADMIN_UNPAUSED` |
| `reason` | human-readable explanation |
| `createdAt` | indexed with `userId`, `feature`, and `status` |

This is the source of truth for monitoring. Example questions it answers:

- **Spend proxy:** `SELECT feature, COUNT(*) FROM AiUsageEvent WHERE status='ALLOWED' AND createdAt > now()-interval '1 day' GROUP BY feature;`
- **Abuse:** users with the most `RATE_LIMITED` rows.
- **Scope tuning:** sample recent `BLOCKED_OFF_TOPIC` reasons to catch false positives.

> Image-moderation rejects are **not** in this table — they're emitted as structured
> `image_moderation_reject` warn logs (see the AI image pipeline doc). Monitor those
> via your log aggregator.

---

## Admin override

An admin can clear a stuck pause via `AdminRegistrationsService.unpauseAi`, which sets
`aiPausedUntil = null` and records an `ADMIN_UNPAUSED` audit event. Use this when the
limiter caught a legitimate power user.

---

## Configuration

| Variable | Default | Effect |
|----------|---------|--------|
| `AI_RATE_LIMIT_WINDOW_MINUTES` | `60` | Sliding window for the call count. |
| `AI_RATE_LIMIT_MAX_CALLS` | `30` | Allowed calls per window before pausing. |
| `AI_RATE_LIMIT_PAUSE_HOURS` | `12` | How long an account stays paused once tripped. |

All three accept positive integers; any invalid value falls back to the default. Tune
`MAX_CALLS` down to cap spend harder, or `WINDOW`/`PAUSE` to change the recovery feel.

---

## Cost notes

- Moderation adds **one `gpt-4o-mini` vision call per image upload**. On the diagnosis
  path it runs in parallel with the diagnosis call, so it adds latency only when it is
  the slowest leg, but it always adds a token charge.
- Dr. Plant chat sends up to the **last 20 turns** per message — the dominant token
  driver in a long conversation. Shorten the cap in `diagnosis-chat.service.ts` if
  per-conversation cost matters more than context depth.

---

## Testing

`ai-usage.service.spec.ts` covers the scope classifier (allow/block cases) and the
rate-limit → pause transition.
