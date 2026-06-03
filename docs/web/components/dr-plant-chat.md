# Component: Dr. Plant chat

> **Navigation:** [Components INDEX](INDEX.md) - `DrPlantChat.tsx`

Embedded on plant profile. Uses `diagnosisChatApi` for threads and messages.
Supports image attachments, follow-up prompt chips, and a guided missing-context
panel for active conversations.

Guided follow-ups:

- **Missing context check** loads quick server-generated questions for the current
  plant thread, such as symptom duration, current soil moisture, recent care or
  environment changes, pests/residue, photo context, and preferred next step.
- Submitted answers are sent back into the same Dr. Plant thread as a concise
  context summary so the assistant can revise advice without making the user
  rewrite everything.
- Other prompt chips request a recovery plan, progress comparison, care task
  ideas, or a journal-ready thread summary.

Assistant replies expose explicit action buttons:

- **Save to journal** saves the reply as a plant journal note.
- **Health check in 3 days** schedules a `HEALTH_CHECK` task and records the reply in the journal for context.
- **Add recovery tasks** suggests task records from the reply and lets the user
  confirm which ones should be scheduled.

Requires OpenAI - [integration](../../integrations/openai.md).
