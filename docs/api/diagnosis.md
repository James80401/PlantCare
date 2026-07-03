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

`GET` returns suggested tasks mapped from the structured `treatmentPlan.steps`
in `detailJson` when present, then falls back to `immediateActions` or advice
lines for older diagnoses. Each item includes `key`, `label`, `taskType`,
`dueInDays`, `alreadyScheduled`, and may include `priority`, `section`, and
`source`.

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

Creates a **`HEALTH_CHECK`** task linked via `sourceDiagnosisId`. Optional `note` is saved as a **journal entry** so follow-up intent appears on the plant timeline.

## Conversations

| Method | Path |
|--------|------|
| GET | `/plants/:plantId/diagnose/conversations` |
| POST | `/plants/:plantId/diagnose/conversations` |
| GET | `/plants/:plantId/diagnose/conversations/:id` |
| POST | `/plants/:plantId/diagnose/conversations/:id/messages` |
| POST | `/plants/:plantId/diagnose/conversations/:id/actions/journal-note` |
| POST | `/plants/:plantId/diagnose/conversations/:id/actions/health-check` |
| POST | `/plants/:plantId/diagnose/conversations/:id/actions/drafts` |
| POST | `/plants/:plantId/diagnose/conversations/:id/actions/recommendation-draft` |
| POST | `/plants/:plantId/diagnose/conversations/:id/actions/task-draft` |

**Files:** `diagnosis.controller.ts`, `diagnosis-chat.controller.ts`, `llm-diagnosis.service.ts`

## Context summary (shipped)

| Method | Path |
|--------|------|
| GET | `/plants/:plantId/diagnose/context` |

Returns a user-facing summary of the **same** signals Dr. Plant feeds the model
(see `DiagnosisChatService.gatherContextSignals`), as readable chips for a
"What Dr. Plant sees" panel on the Health tab. No prompt internals or secrets are
exposed. Recent completed-task feedback is labelled as care observations and can
include the related task type when known. Shape:

```json
{
  "intro": "Dr. Plant tailors answers using your plant's recent care and conditions:",
  "items": [
    { "category": "care", "label": "Care baseline", "detail": "Living room · medium pot · water ~every 7 days · light: Bright indirect" },
    { "category": "health", "label": "Open issue: Overwatering", "detail": "Noted Jun 2" },
    { "category": "tasks", "label": "2 upcoming care tasks", "detail": "next: Water Jun 6" },
    { "category": "feedback", "label": "1 recent care observation", "detail": "Water: soil very dry" }
  ]
}
```

`category` is one of `care | health | tasks | feedback | journal | weather`.
**Files:** `dr-plant-context.ts` (pure builder), `diagnosis-chat.service.ts`,
`diagnosis.controller.ts`; web `DrPlantContextPanel.tsx`.

Chat actions are explicit user-confirmed actions from a Dr. Plant reply:

- `journal-note` saves the selected assistant reply, or an explicit `note`, as a plant journal entry.
- `health-check` creates a pending `HEALTH_CHECK` task and logs the selected reply or `note` to the journal.
- `drafts` returns task/recommendation action cards from a selected assistant reply without changing data.
- `recommendation-draft` confirms one returned recommendation draft and saves it to the durable recommendations system.
- `task-draft` confirms one returned task draft and creates a pending task.

Draft confirmation endpoints accept `messageId` plus `draftKey`. The server
regenerates the draft from the selected reply before creating anything, so the
client cannot silently mutate arbitrary task or recommendation details.

Example body:

```json
{
  "messageId": "diagnosis-message-id",
  "dueInDays": 3
}
```

See [diagnosis pipeline](../architecture/diagnosis-pipeline.md).

## Web UI

| Surface | Status |
|---------|--------|
| Dr. Plant chat | Shipped on plant Health tab |
| One-shot diagnosis | Shipped in Health tab (symptom check form); also callable via API |
| Past diagnoses | Shipped; recovery status and manual follow-up tasks |

See [feature availability](../reference/feature-availability.md).
