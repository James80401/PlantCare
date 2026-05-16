# Tutorial: Using Dr. Plant chat

> **Navigation:** [Tutorials INDEX](INDEX.md) · [API diagnosis](../api/diagnosis.md) · [OpenAI](../integrations/openai.md)

## Requirements

- `OPENAI_API_KEY` with available quota
- Plant profile → **Dr. Plant** section

## Flow

1. List conversations: `GET /plants/:plantId/diagnose/conversations`
2. Start new or continue thread
3. Send message (+ optional image): `POST .../messages`
4. Assistant reply uses species context + vision on images

## Component

`apps/web/src/components/DrPlantChat.tsx`

## Errors

Quota/billing issues → 503; see [troubleshooting](../getting-started/troubleshooting.md).

One-shot diagnosis (no thread): [one-shot diagnosis](one-shot-diagnosis.md)
