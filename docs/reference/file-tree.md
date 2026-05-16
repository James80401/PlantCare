# Source file tree

> **Navigation:** [Reference INDEX](INDEX.md) · [Documentation map](../meta/documentation-map.md)

```
PlantCare/
├── ReadMe.md
├── docs/                    ← Documentation (INDEX.md = hub)
├── package.json
├── .env.example
├── docker-compose.yml
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   ├── seed-care-guides.ts
│   └── data/                ← Catalog & guide generators
├── scripts/
│   ├── verify.mjs
│   ├── verify-care-guides.mjs
│   └── test-integrations.mjs
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── species/
│   │   │   ├── plants/
│   │   │   ├── tasks/
│   │   │   ├── scheduler/
│   │   │   ├── care-guides/
│   │   │   ├── diagnosis/
│   │   │   ├── journal/
│   │   │   ├── billing/
│   │   │   ├── notifications/
│   │   │   ├── weather/
│   │   │   ├── email/
│   │   │   ├── upload/
│   │   │   └── prisma/
│   │   └── scripts/
│   └── web/
│       └── src/
│           ├── App.tsx
│           ├── main.tsx
│           ├── pages/
│           ├── components/
│           ├── context/
│           ├── hooks/
│           ├── services/api.ts
│           ├── constants/
│           └── utils/
└── packages/shared/src/index.ts
```

For module detail, use layer INDEX files — do not duplicate full file lists here.
