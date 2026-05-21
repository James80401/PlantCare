# Tutorial: Outdoor vs indoor plants

> **Navigation:** [Tutorials INDEX](INDEX.md) · [Growing environment](../care-guides/growing-environment.md)

## Location presets (dropdown)

`Living Room`, `Bedroom`, `Kitchen`, `Office`, `Balcony`, `Patio`, `Greenhouse`, `Garden`, `Outdoor garden` — see `apps/web/src/constants/plantLocations.ts`.

There is no **Backyard** preset; if you need that label, the API accepts custom location strings and the scheduler infers environment from keywords (e.g. “backyard” in free text).

## How environment is inferred

| Location keywords | Environment |
|-------------------|-------------|
| Garden, outdoor garden, backyard, … | `outdoor` |
| Balcony, Patio, Greenhouse, … | `semi_outdoor` |
| Default (e.g. Living Room) | `indoor` |

## Effects

| Area | Outdoor behavior |
|------|------------------|
| **Mist tasks** | Not scheduled |
| **Care guide** | “Humidity & misting” says rain/airflow, not pebble trays |
| **Task instructions** | Location-aware mist paragraph |

## Plant profile

**Care guide** section shows General care, Where you grow it, Humidity & misting.

Change location: [changing plant location](changing-plant-location.md)
