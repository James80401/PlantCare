# Page: Add plant

> **Navigation:** [Pages INDEX](INDEX.md) - `apps/web/src/pages/AddPlantWizard.tsx`

Route: `/garden/plants/new`

- First screen separates photo identification from manual name search.
- Photo identification is best for unknown plants and requires review before saving.
- Manual search accepts common names; users do not need scientific names.
- Species search debounce -> `speciesApi.search`
- Discovery filters -> `petSafe`, `lowLight`, `edible`, `droughtTolerant`, `indoor`, `outdoor`
- Result cards show sunlight, watering cadence, toxicity, and discovery tags.
- PlantNet identify -> `plantsApi.identify`
- External matches are framed as provisional. Confirmation creates or links a
  reviewable species record and care guidance is approximate until reviewed.
- Search empty states offer shorter common-name search, filter clearing, full
  catalog browsing, and photo identification.
- Details step clarifies that only garden and species are required; nickname,
  age, date, notes, and photo can be added later.
- Locations from `constants/plantLocations.ts`
- Create -> `plantsApi.create`

**User guide:** [add plant](../../user-guide/add-plant.md) - **Tutorial:** [adding a plant](../../tutorials/adding-a-plant.md)
