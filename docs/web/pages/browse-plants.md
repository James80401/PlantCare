# Browse plants pages

> **Navigation:** [Web pages INDEX](INDEX.md)

## BrowsePlants

**Route:** `/garden/plants/browse`  
**Source:** `apps/web/src/pages/BrowsePlants.tsx`

- Paginated species grid
- Filters and sort controls
- **Recommended** horizontal row (`GET /species/recommended`)
- Recommended cards show up to two visible match reasons plus an overflow count
  so the row stays compact on mobile.
- Missing species photos use text placeholders instead of decorative-only icons.
- Empty results point users toward shorter names, clearing filters, or photo
  identification through the add-plant wizard.
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
