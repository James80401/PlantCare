# Care guide content model

> **Navigation:** [Care guides INDEX](INDEX.md)

Each `CareGuide` row:

- `taskType` — one of 7 task types
- `speciesId` — null = generic fallback
- `sectionsJson` — `[{ heading, body, imageKeys? }]`

Images resolved via `CareGuideImage` → URL `/care-guides/images/{key}.svg` or `/care-guides/photos/{key}.jpg`.
