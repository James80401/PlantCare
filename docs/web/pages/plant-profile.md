# Page: Plant profile

> **Navigation:** [Pages INDEX](INDEX.md) · `apps/web/src/pages/PlantProfile.tsx`

Route: `/garden/plants/:id`

Sections:

- Hero summary: image, species, next task, location, base watering cadence, sunlight, toxicity.
- Sticky section navigation: Overview, Care, Tasks, Journal, Diagnosis.
- Overview: species facts, last completed care, and location editor.
- Care: `careOverview` sections rendered as scan-friendly cards with purpose badges,
  lead snippets, and consistent action/why/warning/reference styling.
- Tasks: pending task cards with care instructions and completion action.
- Journal: note/photo form, observation prompts, growth-measurement note prompts,
  and a unified timeline of journal entries, care actions, and diagnoses.
- Diagnosis: recovery summary, DrPlantChat with follow-up prompts, diagnosis
  history cards, and resolved/active status controls.

Location edit → `plantsApi.update` — [tutorial](../../tutorials/changing-plant-location.md).
