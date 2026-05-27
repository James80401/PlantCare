# API: Diagnosis & Dr. Plant chat

> **Navigation:** [API INDEX](INDEX.md) · `apps/api/src/diagnosis/`

## One-shot

| Method | Path |
|--------|------|
| POST | `/plants/:id/diagnose` |
| PATCH | `/plants/:plantId/diagnose/:diagnosisId` |

Multipart: optional `image`, `symptoms` text.

Status update body:

```json
{ "resolved": true }
```

Use this to mark a diagnosis as active/recovered from the plant profile.

## Recovery tasks from diagnosis (shipped)

| Method | Path |
|--------|------|
| GET | `/plants/:plantId/diagnose/:diagnosisId/recovery-suggestions` |
| POST | `/plants/:plantId/diagnose/:diagnosisId/recovery-tasks` |

`GET` returns suggested tasks mapped from `immediateActions` in `detailJson` (or advice lines), each with `key`, `label`, `taskType`, `dueInDays`, and `alreadyScheduled`.

`POST` body:

```json
{ "keys": ["diagnosis-id:abc123", "diagnosis-id:def456"] }
```

Creates **pending** tasks linked via `sourceDiagnosisId`. Skips types already scheduled for that diagnosis.

## Follow-up task (shipped)

| Method | Path |
|--------|------|
| POST | `/plants/:plantId/diagnose/:diagnosisId/follow-up-task` |

Body:

```json
{
  "dueInDays": 3,
  "note": "Recheck yellow leaves and soil moisture"
}
```

Creates a **`HEALTH_CHECK`** task linked via `sourceDiagnosisId`. The optional `note` is accepted by the API; persisting it on the task or journal is a follow-up improvement (see [improvement-recommendations.md](../product/improvement-recommendations.md) C3).

## Conversations

| Method | Path |
|--------|------|
| GET | `/plants/:plantId/diagnose/conversations` |
| POST | `/plants/:plantId/diagnose/conversations` |
| GET | `/plants/:plantId/diagnose/conversations/:id` |
| POST | `/plants/:plantId/diagnose/conversations/:id/messages` |

**Files:** `diagnosis.controller.ts`, `diagnosis-chat.controller.ts`, `llm-diagnosis.service.ts`

See [diagnosis pipeline](../architecture/diagnosis-pipeline.md).

## Web UI

| Surface | Status |
|---------|--------|
| Dr. Plant chat | Shipped on plant Health tab |
| One-shot diagnosis | Shipped in Health tab (symptom check form); also callable via API |
| Past diagnoses | Shipped; recovery status and manual follow-up tasks |

See [feature availability](../reference/feature-availability.md).
