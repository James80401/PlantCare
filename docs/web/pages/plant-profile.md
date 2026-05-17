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
- Journal: note form plus recent journal entries.
- Diagnosis: DrPlantChat and past diagnosis history.

Location edit → `plantsApi.update` — [tutorial](../../tutorials/changing-plant-location.md).
