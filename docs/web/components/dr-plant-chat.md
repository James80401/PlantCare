# Component: Dr. Plant chat

> **Navigation:** [Components INDEX](INDEX.md) - `DrPlantChat.tsx`

Embedded on plant profile. Uses `diagnosisChatApi` for threads and messages.
Supports image attachments, follow-up prompt chips, and a guided missing-context
panel for active conversations.

The chat distinguishes freeform advice from saved diagnosis history. Users can
ask questions freely in chat, run a structured diagnosis when they want a saved
health-history result, and review every task or recommendation draft before it
changes care.

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

- **Save reply as journal note** saves the reply as a plant journal note.
- **Schedule health check in 3 days** creates a `HEALTH_CHECK` task and records the reply in the journal for context.
- **Review recovery task drafts** suggests task records from the reply and lets the user
  confirm which ones should be scheduled.
- **Review action card drafts** asks the API to create recommendation/task drafts from
  the selected reply. Each card requires its own confirm click before a
  recommendation is saved or a task is created.

Visible action labels should stay explicit:

- Saving a reply creates a journal note.
- Scheduling a health check creates a care task.
- Recovery tasks and action cards are drafts until the user confirms.

Requires OpenAI - [integration](../../integrations/openai.md).
