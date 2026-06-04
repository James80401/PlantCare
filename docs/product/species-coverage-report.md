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
counts. Re-run it and update the table below after any edit to
`prisma/data/species-catalog.ts`.

## Current coverage (321 species)

| Filter attribute | Species tagged | Share | Read |
|------------------|---------------:|------:|------|
| `outdoor`            | 213 | 66% | Healthy |
| `petSafe`            | 214 | 67% | Healthy |
| `indoor`             | 96  | 30% | Healthy |
| `edible`             | 93  | 29% | Healthy |
| `pollinatorFriendly` | 89  | 28% | Healthy |
| `droughtTolerant`    | 57  | 18% | Adequate |
| `highHumidity`       | 13  | 4%  | **Thin** |
| `lowLight`           | 10  | 3%  | **Thin** |
| `bloomsIndoors`      | 9   | 3%  | **Thin** |

All structural checks pass: every species includes core search/care fields, and
there are no duplicate common/scientific name pairs.

## Interpretation

The three **thin** attributes are almost certainly **under-tagging on species
already in the catalog**, not a content gap:

- **`lowLight` (10/321)** — a 321-species catalog will contain many more than ten
  genuinely low-light-tolerant plants (snake plant, ZZ, pothos, peace lily, cast
  iron plant, many philodendrons, aglaonema, etc.). Three percent is implausibly
  low for a houseplant-heavy catalog.
- **`highHumidity` (13/321)** — ferns, calatheas, most aroids, and orchids should
  push this well above 4%.
- **`bloomsIndoors` (9/321)** — plausibly low, but worth a spot-check against the
  indoor flowering set (African violet, anthurium, kalanchoe, orchids, peace lily).

These attributes drive the browse/add-plant **filters**, so under-tagging makes
those filters return thin, less-useful result sets even though the underlying
species exist.

## Recommended next step (needs product confirmation)

A **metadata-quality pass** on existing species is higher value and lower risk
than adding new catalog rows:

1. Confirm which filters matter most to current users (open decision in the
   implementation plan: *"Which species categories matter most?"*).
2. For each confirmed filter, audit the catalog and tag the species that clearly
   qualify, with a verification update so `species:verify` reflects the new
   coverage. Apply horticultural judgment per species — do **not** bulk-tag.
3. Keep this report in sync by re-running `npm run species:verify`.

Adding entirely new species rows (the original CONTENT-1 framing) should only
follow once the existing-catalog tagging is accurate, so new content lands with
correct filter metadata from the start.
