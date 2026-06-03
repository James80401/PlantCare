# Tutorial: Using Dr. Plant chat

> **Navigation:** [Tutorials INDEX](INDEX.md) · [API diagnosis](../api/diagnosis.md) · [OpenAI](../integrations/openai.md) · [Glossary: Dr. Plant](../meta/glossary.md)

## Requirements

- `OPENAI_API_KEY` with available quota (see [troubleshooting](../getting-started/troubleshooting.md) for quota errors)
- A plant in your garden

## UI steps

**From the garden home (`/garden`):**

1. In **Your plants**, tap **Ask Dr. Plant** on the plant card (opens that plant’s Health chat).
2. Or use the **Dr. Plant is ready** card — one plant goes straight to chat; several plants scrolls to the plant list.

**From a plant profile:**

1. Tap **Ask Dr. Plant** in the profile header, or open the **Health** tab.
2. The chat section scrolls into view (`#dr-plant`).
3. Optional: tap a **previous chat** pill to continue a thread.
4. Tap **New chat** to start fresh.
5. Type symptoms or questions, optionally **Attach photo**, then **Send**.
6. In an active thread, open **Missing context check** to answer quick follow-up
   questions before asking Dr. Plant to revise advice.
7. Use reply actions to **Save to journal**, schedule a health check, or add
   suggested recovery tasks.

Direct link: `/garden/plants/:id/health#dr-plant`

Empty state prompts you to describe yellow leaves, spots, drooping, etc.

## API (for developers)

1. List conversations: `GET /plants/:plantId/diagnose/conversations`
2. Start new or continue thread
3. Send message (+ optional image): `POST .../messages`
4. Load guided context questions: `GET .../:conversationId/actions/context-questions`
5. Assistant reply uses species context + vision on images

Implementation: `apps/web/src/components/DrPlantChat.tsx`

## Errors

Quota/billing issues → 503; see [troubleshooting](../getting-started/troubleshooting.md).

If **Send** does nothing or photos fail, ensure the web client is not forcing `Content-Type: application/json` on multipart uploads (see `apps/web/src/services/api.ts` FormData interceptor).

One-shot diagnosis (no thread, **no web create UI**): [one-shot diagnosis](one-shot-diagnosis.md)
