# Tutorial: Using Dr. Plant chat

> **Navigation:** [Tutorials INDEX](INDEX.md) · [API diagnosis](../api/diagnosis.md) · [OpenAI](../integrations/openai.md) · [Glossary: Dr. Plant](../meta/glossary.md)

## Requirements

- `OPENAI_API_KEY` with available quota (see [troubleshooting](../getting-started/troubleshooting.md) for quota errors)
- A plant in your garden

## UI steps

1. Open **/garden/plants/:id** (plant profile)
2. Scroll to the **Dr. Plant** section (`DrPlantChat` component)
3. Optional: tap a **previous chat** pill in the horizontal list to continue a thread
4. Tap **New chat** to start fresh
5. Type symptoms or questions in the text area
6. Optional: **Attach photo** → choose an image file
7. Tap **Send** — first message creates a conversation; replies appear in the thread

Empty state prompts you to describe yellow leaves, spots, drooping, etc.

## API (for developers)

1. List conversations: `GET /plants/:plantId/diagnose/conversations`
2. Start new or continue thread
3. Send message (+ optional image): `POST .../messages`
4. Assistant reply uses species context + vision on images

Implementation: `apps/web/src/components/DrPlantChat.tsx`

## Errors

Quota/billing issues → 503; see [troubleshooting](../getting-started/troubleshooting.md).

One-shot diagnosis (no thread, **no web create UI**): [one-shot diagnosis](one-shot-diagnosis.md)
