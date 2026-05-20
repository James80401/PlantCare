# Browse plants pages

> **Navigation:** [Web pages INDEX](INDEX.md)

## BrowsePlants

**Route:** `/garden/plants/browse`  
**Source:** `apps/web/src/pages/BrowsePlants.tsx`

- Paginated species grid
- Filters and sort controls
- **Recommended** horizontal row (`GET /species/recommended`)
- Links to species detail

## SpeciesBrowseDetail

**Route:** `/garden/plants/browse/:speciesId`  
**Source:** `apps/web/src/pages/SpeciesBrowseDetail.tsx`

- Species hero, metadata panel (`SpeciesMetadataPanel`)
- Growing profile, pests, toxicity from `metadataJson`
- CTA to add plant with species pre-filled

## Related

- [user-guide/browse-plants.md](../../user-guide/browse-plants.md)
- [api/species.md](../../api/species.md)
