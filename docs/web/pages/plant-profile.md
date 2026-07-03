# Page: Plant profile

> **Navigation:** [Pages INDEX](INDEX.md) · `apps/web/src/pages/PlantProfile.tsx`

Route: `/garden/plants/:id`

Sections:

- Hero summary: image, species, next task, location, base watering cadence, sunlight, toxicity.
- Sticky section navigation: Overview, Care, Tasks, Journal, Health.
- Overview: species facts, last completed care, plant-specific recommendations,
  and location editor.
- Care: `careOverview` sections rendered as scan-friendly cards with purpose badges,
  lead snippets, and consistent action/why/warning/reference styling.
- Tasks: pending task cards with care instructions, completion/skip/snooze actions,
  and recent care history with feedback + schedule context.
- Journal: note/photo form, observation prompts, growth-measurement note prompts,
  and a unified timeline of journal entries, care actions, and diagnoses.
- Health: recovery summary, **Ask Dr. Plant** header link, `DrPlantChat` (`#dr-plant`),
  diagnosis history cards, and resolved/active status controls.

Plant-specific recommendations use the shared `RecommendationPanel` UX: source
and priority labels, clear action copy, and a quiet empty state when Dr. Plant
has no extra non-critical guidance.

**User guide:** [plant profile](../../user-guide/plant-profile.md) · **Tutorial:** [changing location](../../tutorials/changing-plant-location.md)
