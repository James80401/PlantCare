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
| Local species catalog | 321 species |
| Species photos | 320 local species photos |
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
| 6. Catalog expansion sprint 1 | `[ ]` | Expand curated high-value inventory beyond the current 321 species. | Add a sourced, verified batch of high-demand houseplants, succulents, edibles, and outdoor ornamentals. |
| 7. Hybrid long-tail identification | `[ ]` | Let users identify plants beyond the local catalog without polluting curated data. | Provider-gated ID/enrichment path records source/confidence and maps to nearest care archetype. |
| 8. Guide intelligence upgrade | `[ ]` | Make care guides richer and more rescue-oriented. | Guides include common mistakes, diagnosis prompts, recovery links, and species-specific caveats. |

## Shipped in the first implementation pass

- Added `apps/api/src/plant-intelligence/plant-problem-library.ts`.
- Added `apps/api/src/plant-intelligence/care-archetypes.ts`.
- Added `apps/api/src/plant-intelligence/treatment-plan.ts`.
- Diagnosis creation now stores a versioned `treatmentPlan` in `detailJson`.
- Recovery suggestions now prefer treatment-plan steps before falling back to old immediate-action parsing.
- Diagnosis result cards now show the treatment plan in the Health tab.
- Added API and web tests for the treatment-plan path.

## Next implementation batch

1. Catalog expansion sprint 1:
   - Add 100-200 high-demand entries, favoring houseplants and beginner rescue searches.
   - Keep the local catalog curated and verified.
   - Run `npm run species:verify` and photo coverage checks after the batch.

2. Guide intelligence upgrade:
   - Add guide sections for common mistakes, rescue signs, and Dr. Plant prompt starters.
   - Prioritize top beginner plants and top problem categories before broad coverage.

3. Hybrid long-tail identification:
   - Add an env-gated provider interface for external ID/enrichment.
   - Store provider, confidence, canonical candidate, and fallback care archetype.
   - Keep curated catalog rows separate from unverified provider guesses.

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

