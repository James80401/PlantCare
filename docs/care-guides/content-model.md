# Care guide content model

> **Navigation:** [Care guides INDEX](INDEX.md)

Each `CareGuide` row:

- `taskType` — one of 12 task types (`WATER`, `FERTILIZE`, `PRUNE`, `MIST`, `PH_TEST`, `PEST_CONTROL`, `REPOT`, `ROTATE`, `CLEAN_LEAVES`, `INSPECT_PESTS`, `CHECK_MOISTURE`, `HEALTH_CHECK`)
- `speciesId` — null = generic fallback
- `sectionsJson` — array of section objects (see below)

### Section shape (seeded templates)

| Field | Role |
|-------|------|
| `heading` | Section title (may include `{placeholders}`) |
| `body` | Default copy (mirrors `beginnerBody` for structured seeds) |
| `whyItMatters` | Short rationale shown above steps |
| `beginnerBody` | Beginner-tier steps and copy |
| `advancedBody` | Advanced-tier steps and copy |
| `warnings` | Optional string array (mistakes, safety) |
| `imageKeys` | Optional illustration keys |

At runtime, `CareGuidesService` may append a **“Your plant right now”** section with plant-specific context. The web [`TaskInstructionsModal`](../../apps/web/src/components/TaskInstructionsModal.tsx) uses [`StructuredCareSectionCard`](../../apps/web/src/components/care/StructuredCareSectionCard.tsx) for beginner/advanced toggle when structured fields are present.

Images resolved via `CareGuideImage` → URL `/care-guides/images/{key}.svg` or `/care-guides/photos/{key}.jpg`.

**Authoring:** [`prisma/data/care-guide-templates.ts`](../../prisma/data/care-guide-templates.ts) · **Verify:** `npx tsx scripts/verify-care-guides.mjs`
