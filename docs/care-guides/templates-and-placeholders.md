# Templates and placeholders

> **Navigation:** [Care guides INDEX](INDEX.md) · Source: `prisma/data/care-guide-templates.ts`

## Common placeholders

| Placeholder | Source |
|-------------|--------|
| `{plantName}` | Nickname or species name |
| `{speciesName}` | Catalog common name |
| `{careNotes}` | Species careNotes |
| `{sunlight}` | Species sunlight |
| `{waterIntervalDays}` | Computed from pot size |
| `{potSize}` | Plant pot enum |
| `{locationNote}` | Growing environment paragraph |
| `{mistNote}` | Mist guidance paragraph |

Personalization: `CareGuidesService.personalize()` and `buildContext()`.
