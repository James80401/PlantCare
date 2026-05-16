# Tutorial: Reading care instructions

> **Navigation:** [Tutorials INDEX](INDEX.md) · [Care guides INDEX](../care-guides/INDEX.md)

1. On a task, click **How to do this**
2. Modal loads `GET /api/v1/tasks/:id/instructions`
3. Content includes:
   - Species-specific or generic guide sections
   - SVG diagrams and optional photos
   - **Your plant right now** — pot interval, sunlight, location, mist note

## Personalization

Rendered from DB templates + runtime context (`CareGuidesService.buildContext`). Placeholders like `{plantName}`, `{waterIntervalDays}`.

Source: `apps/api/src/care-guides/care-guides.service.ts`
