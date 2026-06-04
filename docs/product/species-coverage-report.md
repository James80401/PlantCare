# Species catalog coverage report

> **Status:** measurement artifact, generated 2026-06-03
> **Navigation:** [Roadmap](roadmap.md) (CONTENT-1) · [Implementation plan — Track 5](current-feature-implementation-plan.md) · [Product INDEX](INDEX.md)

This report is the "where we are" measurement that the roadmap's **CONTENT-1**
and implementation plan **Slice 5.1** ask for *before* adding catalog data. It is
produced by `npm run species:verify` (`scripts/verify-species-catalog.mjs`) and
should be regenerated whenever the catalog changes.

## How to regenerate

```bash
npm run species:verify
```

The script validates that every species has core search/care fields, that there
are no duplicate common/scientific name pairs, and prints per-attribute coverage
counts. As of 2026-06-03 the `highHumidity`, `pollinatorFriendly`, and
`bloomsIndoors` counts are computed by calling the **real** inference
(`buildMetadataForSpecies` in `apps/api/src/species/species-metadata.ts`) — the
same function the seed persists to `metadataJson` and the API reads at query
time — so the audit can no longer drift from actual filter behavior. Re-run it
and update the table below after any edit to `prisma/data/species-catalog.ts` or
the inference heuristics.

## Current coverage (321 species)

| Filter attribute | Species tagged | Share | Read |
|------------------|---------------:|------:|------|
| `petSafe`            | 214 | 67% | Healthy |
| `outdoor`            | 213 | 66% | Healthy |
| `indoor`             | 96  | 30% | Healthy |
| `edible`             | 93  | 29% | Healthy |
| `pollinatorFriendly` | 70  | 22% | Healthy |
| `droughtTolerant`    | 57  | 18% | Adequate |
| `highHumidity`       | 37  | 12% | Adequate |
| `bloomsIndoors`      | 17  | 5%  | Adequate |
| `lowLight`           | 10  | 3%  | **Conservative (by design)** |

All structural checks pass: every species includes core search/care fields, and
there are no duplicate common/scientific name pairs.

## What changed in this pass (2026-06-03)

A **metadata-quality pass** broadened the inference so genuinely-qualifying
species are recognized, rather than adding new catalog rows:

- **`highHumidity` 13 → 37** — `inferHumidity` now recognizes high-humidity plant
  families by name (ferns, Marantaceae/prayer plants, tropical aroids like
  alocasia/caladium/anthurium, fittonia, croton, carnivorous plants, air plants,
  orchids, bromeliads, rex begonias) in addition to the previous careNotes
  keyword check. Succulents stay on the low-humidity track.
- **`bloomsIndoors` 9 → 17** — the indoor-bloomer whitelist was expanded
  (kalanchoe, cyclamen, streptocarpus, hoya, amaryllis, clivia, oxalis,
  geraniums, etc.) **and** made authoritative: it now wins over the generic
  succulent bloom-season copy, fixing a bug where reliable indoor bloomers such
  as Christmas cactus were incorrectly excluded.
- **`pollinatorFriendly` 89 → 70** — not a regression: the previous audit used a
  looser local heuristic than the app. The audit now reports the app's true
  number.

## `lowLight` is intentionally conservative

`lowLight` keys off the catalog `sunlight` string (`includes('low')`) and was
deliberately left at 10. A heuristic that also scanned care notes for "low light"
produced false positives — e.g. *Old Man Cactus* ("white hair slows in indoor
low light") and *Haworthia* ("tolerates lower light than many succulents") are
bright/full-sun plants whose notes mention low light only as a warning or a
relative comparison. Genuinely low-light-**tolerant** (not merely shade-surviving)
plants are a real minority, so 10 is defensible. Lifting it accurately requires
curated, per-species edits to the `sunlight` field — not a heuristic — and should
be done only after confirming product priority.

## Recommended next step (needs product confirmation)

1. Confirm which filters matter most to current users (open decision in the
   implementation plan: *"Which species categories matter most?"*).
2. If `lowLight` is a priority, hand-edit `sunlight` strings for the specific
   shade-tolerant species that qualify (e.g. add "Low to …" for cast iron plant,
   aglaonema, parlor palm where appropriate) and re-run the audit.
3. Adding entirely new species rows (the original CONTENT-1 framing) should only
   follow once existing-catalog tagging is accurate, so new content lands with
   correct filter metadata from the start.
4. Keep this report in sync by re-running `npm run species:verify`.
