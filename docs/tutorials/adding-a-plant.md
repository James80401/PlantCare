# Tutorial: Adding a plant

> **Navigation:** [Tutorials INDEX](INDEX.md) · [Web: add plant](../web/pages/add-plant.md) · [API: plants](../api/plants.md)

## UI steps

1. Go to **/garden/plants/new**
2. **Search species** (type 2+ characters)
3. Optional: **Identify from photo** (PlantNet if configured)
4. Set **nickname**, **where it grows**, **pot size**, optional photo
5. **Save plant** → profile page

## What happens in the backend

1. `POST /api/v1/plants` creates `Plant` row
2. `SchedulerService.generateTasksForPlant` deletes pending tasks and creates ~90 days of:
   - WATER (interval from species × pot multiplier)
   - PRUNE (monthly)
   - FERTILIZE / MIST (premium + rules) — see [scheduling](../architecture/scheduling.md)

## Outdoor tip

Choose **Garden** or **Outdoor garden** to skip indoor mist reminders. See [outdoor vs indoor](outdoor-vs-indoor-plants.md).
