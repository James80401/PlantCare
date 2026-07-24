# Species catalog coverage report

> **Status:** measurement artifact, updated 2026-06-30
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

## Current coverage (447 species)

| Filter attribute | Species tagged | Share | Read |
|------------------|---------------:|------:|------|
| `petSafe`            | 277 | 62% | Healthy |
| `outdoor`            | 255 | 57% | Healthy |
| `indoor`             | 166 | 37% | Healthy |
| `edible`             | 108 | 24% | Healthy |
| `pollinatorFriendly` | 83  | 19% | Healthy |
| `droughtTolerant`    | 95  | 21% | Healthy |
| `highHumidity`       | 71  | 16% | Healthy |
| `bloomsIndoors`      | 32  | 7%  | Adequate |
| `lowLight`           | 18  | 4%  | **Conservative (by design)** |

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

## Catalog expansion sprint 1 (2026-06-30)

Added a curated high-demand batch across collectible houseplants, aroids,
prayer plants, hoyas, peperomias, ficus/dracaena/aglaonema variants, ferns,
succulents, cacti, orchids, carnivorous plants, edible crops, fruit, and
outdoor ornamentals. The verifier now requires at least 400 species, so future
catalog shrinkage or accidental data loss is caught in `npm run species:verify`.

Photo follow-up: the expanded catalog now has verified local reusable photos
for all 447 species. Exact Wikimedia Commons sources closed the final Hoya
Mathilde and String of Dolphins gaps on 2026-07-23. The source, license,
attribution, verification commands, and earlier rejected-source review are
tracked in [species-photo-sourcing-log.md](species-photo-sourcing-log.md).
