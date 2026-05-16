# Care guide pipeline

> **Navigation:** [Architecture INDEX](INDEX.md) · [Care guides INDEX](../care-guides/INDEX.md)

```
prisma/data/templates  →  seed-care-guides.ts  →  CareGuide + CareGuideImage (DB)
                                                      ↓
Task complete / instructions request  →  CareGuidesService  →  JSON + images
```

## Read path

`GET /tasks/:id/instructions` → species guide or generic fallback → personalize → append “Your plant right now”.

## Write path (content updates)

Edit `prisma/data/*` → `npm run db:seed` → `verify-care-guides.mjs`
