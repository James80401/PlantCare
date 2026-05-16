# API: Diagnosis & Dr. Plant chat

> **Navigation:** [API INDEX](INDEX.md) · `apps/api/src/diagnosis/`

## One-shot

| Method | Path |
|--------|------|
| POST | `/plants/:id/diagnose` |

Multipart: optional `image`, `symptoms` text.

## Conversations

| Method | Path |
|--------|------|
| GET | `/plants/:plantId/diagnose/conversations` |
| POST | `/plants/:plantId/diagnose/conversations` |
| GET | `/plants/:plantId/diagnose/conversations/:id` |
| POST | `/plants/:plantId/diagnose/conversations/:id/messages` |

**Files:** `diagnosis.controller.ts`, `diagnosis-chat.controller.ts`, `llm-diagnosis.service.ts`

See [diagnosis pipeline](../architecture/diagnosis-pipeline.md).
