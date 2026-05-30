# Component: Dr. Plant chat

> **Navigation:** [Components INDEX](INDEX.md) · `DrPlantChat.tsx`

Embedded on plant profile. Uses `diagnosisChatApi` for threads and messages.
Supports image attachments and follow-up prompt chips for recovery checks.

Assistant replies expose explicit action buttons:

- **Save to journal** saves the reply as a plant journal note.
- **Health check in 3 days** schedules a `HEALTH_CHECK` task and records the reply in the journal for context.

Requires OpenAI — [integration](../../integrations/openai.md).
