# Page: Add plant

> **Navigation:** [Pages INDEX](INDEX.md) · `apps/web/src/pages/AddPlant.tsx`

Route: `/garden/plants/new`

- Species search debounce → `speciesApi.search`
- Discovery filters → `petSafe`, `lowLight`, `edible`, `droughtTolerant`, `indoor`, `outdoor`
- Result cards show sunlight, watering cadence, toxicity, and discovery tags
- PlantNet identify → `plantsApi.identify`
- Locations from `constants/plantLocations.ts`
- Create → `plantsApi.create`

**User guide:** [add plant](../../user-guide/add-plant.md) · **Tutorial:** [adding a plant](../../tutorials/adding-a-plant.md)
