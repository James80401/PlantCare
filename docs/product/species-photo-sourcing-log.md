# Species Photo Sourcing Log

Last updated: 2026-07-03

This log tracks exact reusable-source checks for catalog plants that still lack
local species photos. It exists so we do not accidentally fill product gaps with
parent-species photos, nursery/blog images, or restricted-license media.

## Current status

| Metric | Count |
|--------|-------|
| Catalog species | 447 |
| Species with verified local reusable photos | 445 |
| Remaining source gaps | 2 |

Remaining gaps:

| Common name | Scientific name | Catalog key | Status |
|-------------|-----------------|-------------|--------|
| Hoya Mathilde | Hoya mathilde | `seed-hoya-mathilde-hoya-mathilde` | Blocked on exact reusable source |
| String of Dolphins | Curio peregrinus / x Bacurio delphinatifolius | `seed-string-of-dolphins-curio-peregrinus` | Blocked on exact reusable source |

## 2026-07-03 source review

Commands run:

```powershell
npm.cmd run species:photos:list-missing
node apps/api/scripts/fetch-species-photo-sources.mjs --only-missing
```

Results:

- `species:photos:list-missing` reported `Missing: 2/447`.
- `fetch-species-photo-sources --only-missing` skipped the 445 already-covered
  species and found no match for Hoya Mathilde or String of Dolphins.

Manual exact-source checks:

| Target | Source checked | Result | Decision |
|--------|----------------|--------|----------|
| Hoya mathilde | iNaturalist taxa API | No exact reusable taxon photo found | Keep blocked |
| Hoya mathilde | iNaturalist observation API with `photo_license=CC0,CC-BY,CC-BY-SA` | No reusable observation results found | Keep blocked |
| Hoya mathilde | Wikimedia Commons exact file search | No exact media results found | Keep blocked |
| Curio peregrinus | iNaturalist taxa API | Returned `x Bacurio delphinatifolius`, default photo ID `239939970`, license `cc-by-nc` | Rejected because non-commercial licenses are not product-reusable |
| Curio peregrinus | iNaturalist observation API with `photo_license=CC0,CC-BY,CC-BY-SA` | No reusable observation results found | Keep blocked |
| x Bacurio delphinatifolius | iNaturalist observation API with `photo_license=CC0,CC-BY,CC-BY-SA` | No reusable observation results found | Keep blocked |
| Curio peregrinus | Wikimedia Commons exact file search | No exact media results found | Keep blocked |
| String of Dolphins plant | Wikimedia Commons file search | No exact plant media results found | Keep blocked |

## Guardrails

- Do not use nursery, ecommerce, blog, Pinterest, Reddit, or social-media photos
  unless we obtain explicit reusable permission and store attribution.
- Do not substitute parent species, related hybrids, or lookalike plants.
- Do not accept CC BY-NC, CC BY-ND, "all rights reserved", unknown-license, or
  "see source page" images for product catalog photos.
- Do not mark these species complete unless both the manifest entry and local
  file pass `npm run species:photos:list-missing`.

## Acceptable ways to close the gaps

1. Add owned photos taken by the Dr. Plant team or a contractor.
2. Request direct written permission from a photographer and store the source,
   license, and attribution in `prisma/data/species-photo-sources.json`.
3. Use a paid stock or institutional image only if the license permits product
   display, derivative resizing/compression, and long-term distribution.
4. If launch needs zero gaps before source closure, add a designed "photo
   pending" placeholder state instead of a plant lookalike.

## Completion checklist

When a valid source is found:

1. Add the source metadata to `prisma/data/species-photo-sources.json`.
2. Download the image to
   `apps/api/src/care-guides/photos/species/<catalog-key>.jpg`.
3. Run `npm run species:photos:list-missing` and confirm `Missing: 0/447`.
4. Run `npm run species:photos:verify`.
5. Run `npm run species:photos:audit-licenses` if the source is not already in a
   known reusable-license format.
