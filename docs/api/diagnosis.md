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

## Conversations

| Method | Path |
|--------|------|
| GET | `/plants/:plantId/diagnose/conversations` |
| POST | `/plants/:plantId/diagnose/conversations` |
| GET | `/plants/:plantId/diagnose/conversations/:id` |
| POST | `/plants/:plantId/diagnose/conversations/:id/messages` |

**Files:** `diagnosis.controller.ts`, `diagnosis-chat.controller.ts`, `llm-diagnosis.service.ts`

See [diagnosis pipeline](../architecture/diagnosis-pipeline.md).

## Recovery follow-up task design

Section 6 implements recovery status and journal follow-up notes first. A
dedicated follow-up task API should come next when the task model can represent
health-check work explicitly.

Proposed API:

```http
POST /plants/:plantId/diagnose/:diagnosisId/follow-up-task
```

Proposed body:

```json
{
  "dueInDays": 3,
  "note": "Recheck yellow leaves and soil moisture"
}
```

Recommended data-model addition before implementation:

- Add a `HEALTH_CHECK` task type, or add a task `source`/`sourceDiagnosisId`
  field so recovery follow-ups do not masquerade as pest-control or watering
  tasks.
- Return the created task with plant/species included so the existing task UI can
  render it immediately.
