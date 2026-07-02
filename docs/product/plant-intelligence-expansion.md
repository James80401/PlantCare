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
| Species photos | 445 local species photos; 2 catalog rows still need reusable photo sourcing/review |
| Task types | 12 shipped care task types |
| Diagnosis storage | `Diagnosis.detailJson` stores forward-compatible structured data |
| Dr. Plant context | Uses care baseline, tasks, diagnoses, journal, weather, and feedback context |
| Hybrid identification | External photo ID results stay provisional until user confirmation creates a first-class `PlantSpecies` row with source metadata |
| Store release | Parked until full launch; PWA install is okay during private hosting |
| Plant Life history | Per-plant progress check-ins support edit/delete, AI story recompute, task handoff, trend strip, and derived progress markers |

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
| 7. Hybrid long-tail identification | `[x]` | Let users identify plants beyond the local catalog without polluting curated data. | Provider-gated ID/enrichment path records source/confidence, maps to nearest care archetype, and promotes to `PlantSpecies` only after user confirmation. |
| 8. Guide intelligence upgrade | `[x]` | Make care guides richer and more rescue-oriented. | Guides include common mistakes, diagnosis prompts, recovery links, and species-specific caveats. |
| 9. Plant Life progress polish | `[x]` | Turn progress check-ins into a manageable plant-history surface. | Users can edit/delete progress entries, health-check tasks deep-link into check-ins, AI summaries refresh after edits, and the Journal tab shows latest story, trend, markers, and history. |

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

## Shipped in hybrid long-tail identification

- Changed photo identification so unknown external provider results are provisional and do not silently create catalog rows.
- Added explicit user confirmation for external matches; confirmation creates a normal `PlantSpecies` row and stores provider, match id, confidence, confirmation time, and user-confirmed status in `metadataJson.externalSource`.
- Added a safe care-archetype fallback for provisional matches so Dr. Plant can explain the starting care model before species-specific notes are reviewed.
- Updated the Add Plant wizard to show external-match status, confidence, archetype guidance, and a confirmation action before plant details.
- Added admin-only external species review tooling so user-confirmed long-tail IDs can be marked `reviewed` or `curated` before the catalog treats them as fully vetted.
- Added inline admin review edits for externally confirmed species: care notes, light, watering cadence, toxicity/safety copy, default image URL, source notes, review notes, and photo/license review state.
- Added admin filters for `user_confirmed`, `reviewed`, and `curated` external species review states.
- Added contextual guide links from diagnosis treatment plans into relevant plant-problem guides, plus compact Dr. Plant handoffs from plant Care guide cards.

## Shipped in Plant Life progress polish

- Added edit and delete support for `PlantProgressEntry` through authenticated plant progress APIs.
- Recomputed Dr. Plant progress summaries when check-in fields, notes, or photos change.
- Added a Health Check task handoff so pending `HEALTH_CHECK` rows can open the exact Plant Life check-in flow.
- Expanded the Journal tab's progress area into a Plant Life surface with latest story, flags, trend strip, derived progress markers, photo thumbnails, and full entry history controls.
- Added focused API and web regression tests for progress entry management and health-check task routing.

## Next implementation batch

1. Remaining photo cleanup:
   - Hoya Mathilde and String of Dolphins still need exact truly reusable photo sources.
   - Checked iNaturalist and Wikimedia Commons for exact Hoya Mathilde/Hoya mathilde, Curio peregrinus, Senecio peregrinus, String of Dolphins, and `× Bacurio delphinatifolius`; no acceptable CC0/CC-BY/CC-BY-SA exact-match image was found.
   - The automated Commons resolver briefly matched String of Dolphins to a non-plant "String Figures" file; resolver title matching is now stricter to prevent that false positive.
   - Aloe Aristata has a verified public-domain Wikimedia Commons photo.
   - Re-run `npm run species:photos:list-missing` and `npm run species:photos:verify` after each source pass.

2. Guide UX polish:
   - Contextual treatment-plan links and compact "Ask Dr. Plant about this" care-card actions are shipped.
   - Next polish layer: measure whether guide links get used and add more route-specific guide targets if the problem library expands.

3. Hybrid ID review follow-up:
   - Inline editing, photo/license review state, and status filters are shipped.
   - Next polish layer: add bulk actions only after review volume justifies them.

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
