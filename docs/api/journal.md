# API: Journal

> **Navigation:** [API INDEX](INDEX.md) · `apps/api/src/journal/`

| Method | Path |
|--------|------|
| GET | `/plants/:plantId/journal` |
| POST | `/plants/:plantId/journal` |

Multipart create/update with optional `photo`. At least one of **notes** or **photo** is required on create. PATCH accepts `removePhoto=true` to clear an existing photo.

Stored as `JournalEntry`. Web: plant profile **Journal** tab.
