# Dr. Plant intelligence expansion tracker

> **Status:** active product intelligence work, started 2026-06-30  
> **Navigation:** [Product INDEX](INDEX.md) · [Roadmap](roadmap.md) · [Current implementation plan](current-feature-implementation-plan.md)

This tracker owns the work to make Dr. Plant competitive on plant inventory,
diagnosis quality, treatment follow-through, guide depth, and beginner ease of
use. The strategy is balanced depth: improve the top user rescue moments first,
keep catalog growth measurable, and add long-tail identification behind explicit
provider gates instead of pretending the local catalog already covers everything.

## Current baseline

| Area | Baseline |
|------|----------|
| Local species catalog | 447 species |
| Species photos | 444 local species photos; 3 catalog rows still need photo sourcing/review |
| Task types | 12 shipped care task types |
| Diagnosis storage | `Diagnosis.detailJson` stores forward-compatible structured data |
| Dr. Plant context | Uses care baseline, tasks, diagnoses, journal, weather, and feedback context |
| Store release | Parked until full launch; PWA install is okay during private hosting |

## Progress legend

| Mark | Meaning |
|------|---------|
| `[ ]` | Not started |
| `[~]` | In progress |
| `[x]` | Shipped and tested |
| `[!]` | Blocked or needs decision |
| `[?]` | Needs product review |

## Checkpoint roadmap

| Checkpoint | Status | Goal | Acceptance |
|------------|--------|------|------------|
| 0. Baseline audit | `[x]` | Measure catalog, photo, category, and diagnosis hooks before building. | Current catalog and diagnosis extension points are known. |
| 1. Plant problem library | `[x]` | Add a curated beginner rescue library for common houseplant problems. | Problems include causes, immediate actions, avoidance notes, escalation language, timelines, and task templates. |
| 2. Care archetype system | `[x]` | Classify plants into practical care archetypes for treatment modifiers. | Treatment plans can adjust advice for tropical foliage, drought-tolerant, high-humidity, edible, flowering, and general plants. |
| 3. Treatment plan engine | `[x]` | Convert symptoms, diagnosis output, and species context into a structured plan. | Diagnoses save a versioned `treatmentPlan` in `detailJson` without a DB migration. |
| 4. Recovery task upgrade | `[x]` | Create schedule-ready recovery suggestions from treatment-plan steps first. | Recovery suggestions include treatment-plan steps plus priority/section metadata while preserving existing API keys. |
| 5. Diagnosis UX upgrade | `[x]` | Show treatment plan, urgency, ordered steps, matched problems, and recovery window. | Diagnosis cards render the plan and still support older diagnoses without treatment plans. |
| 6. Catalog expansion sprint 1 | `[x]` | Expand curated high-value inventory beyond the original 321 species. | Added a verified high-demand batch across houseplants, succulents, edibles, fruit, orchids, carnivorous plants, and outdoor ornamentals. |
| 7. Hybrid long-tail identification | `[ ]` | Let users identify plants beyond the local catalog without polluting curated data. | Provider-gated ID/enrichment path records source/confidence and maps to nearest care archetype. |
| 8. Guide intelligence upgrade | `[x]` | Make care guides richer and more rescue-oriented. | Guides include common mistakes, diagnosis prompts, recovery links, and species-specific caveats. |

## Shipped in the first implementation pass

- Added `apps/api/src/plant-intelligence/plant-problem-library.ts`.
- Added `apps/api/src/plant-intelligence/care-archetypes.ts`.
- Added `apps/api/src/plant-intelligence/treatment-plan.ts`.
- Diagnosis creation now stores a versioned `treatmentPlan` in `detailJson`.
- Recovery suggestions now prefer treatment-plan steps before falling back to old immediate-action parsing.
- Diagnosis result cards now show the treatment plan in the Health tab.
- Added API and web tests for the treatment-plan path.

## Shipped in catalog expansion sprint 1

- Expanded the local catalog from 321 to 447 species.
- Raised `scripts/verify-species-catalog.mjs` so 400+ species is now an enforced verification gate.
- Improved measured coverage:
  - `petSafe`: 277
  - `lowLight`: 18
  - `edible`: 108
  - `droughtTolerant`: 95
  - `indoor`: 166
  - `outdoor`: 255
  - `highHumidity`: 71
  - `pollinatorFriendly`: 83
  - `bloomsIndoors`: 32
- Photo sourcing remains open for the new sprint-1 rows; do not run a production photo-coverage gate until those assets are fetched, reviewed, and seeded.

## Shipped in guide intelligence upgrade

- Added generated `Rescue playbook` sections across structured task guides with common mistakes, warning signs, and category-specific caveats.
- Added generated `Ask Dr. Plant with context` sections so each guide has a task-specific diagnostic prompt starter.
- Added a `Troubleshooting` card to plant profile Care overviews with stabilization guidance, Dr. Plant prompt context, and safety escalation language.
- Extended `scripts/verify-care-guides.mjs` so sampled species guides must retain the rescue and Dr. Plant intelligence layers.

## Next implementation batch

1. Hybrid long-tail identification:
   - Add an env-gated provider interface for external ID/enrichment.
   - Store provider, confidence, canonical candidate, and fallback care archetype.
   - Keep curated catalog rows separate from unverified provider guesses.

2. Remaining photo cleanup:
   - Fetch, license-check, and seed images for the new catalog rows.
   - Re-run `npm run species:photos:verify` after DB seed reflects the new catalog.

3. Guide UX polish:
   - Add contextual cross-links from problem/treatment plan cards into relevant guide sections.
   - Consider compact "Ask Dr. Plant about this" actions in guide cards after product review.

## Product guardrails

- Do not add fake volume. A smaller high-quality catalog is better than many thin rows.
- Do not publish app-store builds until explicit launch approval.
- Do not let Dr. Plant silently create tasks; user confirmation remains required.
- Use beginner-safe treatment language and avoid unsupported cure claims.
- Treat toxic plants, edible plants, pesticides, and severe decline with extra safety copy.

## Verification checklist

- [x] API treatment-plan unit tests.
- [x] Recovery suggestion mapper tests.
- [x] Diagnosis result component test.
- [ ] Full API suite after each backend expansion.
- [ ] Full web suite after each user-facing treatment or guide UI change.
- [ ] `npm run build` before deploy.
- [ ] `npm run verify:docs` after docs edits.
- [ ] Live private sign-off after deploy.
