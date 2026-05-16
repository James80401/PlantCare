# Growing environment and misting

> **Navigation:** [Care guides INDEX](INDEX.md) · Source: `growing-environment.ts`

## Inference

From `Plant.location` string → `indoor` | `outdoor` | `semi_outdoor`.

## shouldScheduleMist(env, category)

| Condition | Mist tasks |
|-----------|------------|
| Outdoor | No |
| Succulent / cactus | No |
| Semi-outdoor | Only fern, palm, moisture, orchid, aroid |
| Indoor | Yes (except succulent/cactus) |

## Care overview

`buildPlantCareOverview()` on plant GET — sections: General care, Where you grow it, Humidity & misting, Your notes.

Tutorial: [outdoor vs indoor](../tutorials/outdoor-vs-indoor-plants.md)
