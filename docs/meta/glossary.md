# Glossary

> **Navigation:** [Meta INDEX](INDEX.md) · [Master INDEX](../INDEX.md)

| Term | Meaning |
|------|---------|
| **Garden** | Authenticated app area under `/garden` |
| **Species** | Catalog row (`PlantSpecies`) — shared care metadata |
| **Plant** | User-owned instance linked to a species |
| **Task** | Scheduled care action (`WATER`, `MIST`, …) with `dueDate` |
| **Care guide** | DB-stored tutorial for a task type (+ optional species) |
| **Personalization** | Runtime substitution of `{placeholders}` (pot, location, name) |
| **Dr. Plant** | Diagnosis assistant (one-shot + multi-turn chat) |
| **Growing environment** | `indoor` \| `outdoor` \| `semi_outdoor` inferred from location string |
| **Scheduler** | Service that generates ~90 days of pending tasks |
| **Premium** | Plan tier unlocking mist tasks, fertilize in season, etc. |
| **Species-specific guide** | `CareGuide` row with `speciesId` set |
| **Generic guide** | `CareGuide` with `speciesId` null — fallback |
| **Perenual** | Optional external species API enrichment |
| **PlantNet** | Optional photo identification API |

See [reference/routes-quick-reference.md](../reference/routes-quick-reference.md) for HTTP paths.
