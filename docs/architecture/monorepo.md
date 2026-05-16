# Monorepo structure

> **Navigation:** [Architecture INDEX](INDEX.md) · [File tree](../reference/file-tree.md)

```
PlantCare/
├── apps/api/           NestJS — business logic, Prisma
├── apps/web/           React — UI only
├── packages/shared/    Enums shared by api (and potentially web)
├── prisma/             Schema + seed (root-level)
└── scripts/            Cross-cutting verify scripts
```

Prisma lives at **repo root** (not inside `apps/api`). API imports `@prisma/client` after `db:generate`.
