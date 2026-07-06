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
- Journal: note/photo form, Plant Life check-ins, observation prompts, growth
  measurements, and a unified timeline of journal, progress, care, and health
  events.
- Health: recovery summary, Ask Dr. Plant header link, `DrPlantChat`
  (`#dr-plant`), diagnosis history cards, and active/resolved status controls.

Plant-specific recommendations use the shared `RecommendationPanel` UX: source
and priority labels, clear action copy, and a quiet empty state when Dr. Plant
has no extra non-critical guidance. Task-backed recommendations open a
confirmation panel before creating a care task.

**User guide:** [plant profile](../../user-guide/plant-profile.md) - **Tutorial:** [changing location](../../tutorials/changing-plant-location.md)
