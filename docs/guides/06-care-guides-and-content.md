# Guide 06 — Care guides & content system

> **Navigation:** [Guides INDEX](INDEX.md) · [Care guides INDEX](../care-guides/INDEX.md)

## Purpose

Care guides are the **instruction layer** behind every task. When a user taps “Water” or opens task instructions, they see structured sections (steps, tips, warnings) personalized to the plant.

Content is **data-driven**: thousands of guides live in the database; images are static files.

---

## Content model

| Concept | Storage |
|---------|---------|
| Template guide | `CareGuide` row: `taskType`, `speciesId`, `sectionsJson` |
| Sections | JSON array: `heading`, `body`, `whyItMatters`, `beginnerBody`, `advancedBody`, optional `warnings`, `imageKeys` |
| Images | SVG in `apps/api/src/care-guides/images/`; photos in `photos/` |
| Personalization | Runtime merge in `CareGuidesService` |

Read: [care-guides/content-model.md](../care-guides/content-model.md).

---

## Classification & environment

Plants are classified for:

- **Indoor vs outdoor** — suppresses misting outdoors, adjusts watering copy.
- **Light level** — affects rotate/wipe frequency suggestions.
- **Pot size** — volume hints in water tasks.
- **Season** — schedule suggestions and copy tweaks.

Read: [care-guides/classification.md](../care-guides/classification.md), [growing-environment.md](../care-guides/growing-environment.md).

---

## Templates & placeholders

Guide bodies use placeholders replaced at serve time, e.g. plant nickname, species name, interval days.

Read: [care-guides/templates-and-placeholders.md](../care-guides/templates-and-placeholders.md).

---

## Pipeline (authoring → runtime)

```
seed-care-guides.ts  →  CareGuide rows in DB
        ↓
Plant created/updated  →  Scheduler creates Tasks
        ↓
GET /tasks/:id/instructions  →  CareGuidesService
        ↓
JSON sections + image URLs  →  TaskInstructionsModal (web)
```

Architecture: [architecture/care-guide-pipeline.md](../architecture/care-guide-pipeline.md).

---

## Species photos

| Script | Role |
|--------|------|
| `species:photos:fetch` | Discover image sources |
| `species:photos:download` | Download to `photos/species/` |
| `species:verify` | Catalog integrity |

Attribution: `apps/api/src/care-guides/photos/ATTRIBUTION.md`.

Read: [care-guides/assets.md](../care-guides/assets.md), [care-guides/verification.md](../care-guides/verification.md).

---

## API surfaces

- `GET /tasks/:id/instructions` — primary consumer
- `GET /plants/:id` care overview — profile Care tab
- Static `GET /care-guides/images/*`, `/care-guides/photos/*`

---

## Editing content safely

1. Change seed or CSV/catalog in `prisma/data/`.
2. `npm run db:seed` (dev) or migration script (prod).
3. Run `npx tsx scripts/verify-care-guides.mjs`.
4. Spot-check in UI task modal.

---

## Related

- [api/tasks.md](../api/tasks.md)
- [web/components/task-instructions.md](../web/components/task-instructions.md)
- [tutorials/reading-care-instructions.md](../tutorials/reading-care-instructions.md)
