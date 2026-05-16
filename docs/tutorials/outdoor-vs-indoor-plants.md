# Tutorial: Outdoor vs indoor plants

> **Navigation:** [Tutorials INDEX](INDEX.md) · [Growing environment](../care-guides/growing-environment.md)

## Location presets

`Living Room`, `Garden`, `Outdoor garden`, `Balcony`, `Patio`, etc. — see `apps/web/src/constants/plantLocations.ts`.

## How environment is inferred

| Location keywords | Environment |
|-------------------|-------------|
| Garden, Backyard, Outdoor garden, … | `outdoor` |
| Balcony, Patio, Greenhouse, … | `semi_outdoor` |
| Default | `indoor` |

## Effects

| Area | Outdoor behavior |
|------|------------------|
| **Mist tasks** | Not scheduled |
| **Care guide** | “Humidity & misting” says rain/airflow, not pebble trays |
| **Task instructions** | Location-aware mist paragraph |

## Plant profile

**Care guide** section shows General care, Where you grow it, Humidity & misting.

Change location: [changing plant location](changing-plant-location.md)
