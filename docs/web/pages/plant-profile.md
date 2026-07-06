# Page: Plant profile

> **Navigation:** [Pages INDEX](INDEX.md) - `apps/web/src/pages/PlantProfile.tsx`

Route: `/garden/plants/:id`

Sections:

- Hero summary: image, species, current status chip, growing environment, care
  summary tiles, toxicity/safety note, and primary actions.
- Sticky section navigation: Overview, Care, Tasks, Journal, Health.
- Overview: "What matters now" panel, next care, health, recent care, species
  facts, plant-specific recommendations, details editor, and location editor.
- Care: care-at-a-glance panel followed by `careOverview` sections in
  beginner-friendly scan order. Cards include purpose badges, lead snippets,
  beginner/advanced detail controls, warnings, and topic-specific Dr. Plant
  links.
- Tasks: pending task cards with care instructions, completion/skip/snooze
  actions, and recent care history with feedback plus schedule context.
- Journal: note/photo form, Plant Check-Ins, observation prompts, growth
  measurements, Plant Life summaries, and a unified timeline of journal, care,
  check-in, and health events.
- Health: recovery summary, "What Dr. Plant sees" context, structured symptom
  check, `DrPlantChat` (`#dr-plant`), diagnosis history cards, draft action
  confirmation, and active/resolved status controls.

Plant-specific recommendations use the shared `RecommendationPanel` UX: source
and priority labels, clear action copy, and a quiet empty state when Dr. Plant
has no extra non-critical guidance. Task-backed recommendations open a
confirmation panel before creating a care task.

The Journal tab uses "Journal note" for lightweight observations and "Plant
Check-In" for periodic health/development reports. Check-ins are grouped by
overall condition, leaves/growth, soil/water and recent care, pests or concerns,
and optional photo. Dr. Plant-generated Plant Life summaries are shown separately
from the raw check-in entry so users can tell what was submitted versus what was
analyzed.

The Health tab distinguishes freeform chat from structured saved diagnosis.
Diagnosis cards show what the result is based on and surface treatment safety
notes when available. Dr. Plant chat reply actions are explicit save/schedule
actions, while recovery tasks and action cards stay drafts until confirmed.

**User guide:** [plant profile](../../user-guide/plant-profile.md) - **Tutorial:** [changing location](../../tutorials/changing-plant-location.md)
