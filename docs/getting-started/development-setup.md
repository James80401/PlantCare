# Development setup

> **Navigation:** [Getting started INDEX](INDEX.md)

## Monorepo workspaces

| Package | Path | Role |
|---------|------|------|
| `@plant-care/api` | `apps/api` | NestJS REST API |
| `@plant-care/web` | `apps/web` | React SPA |
| `@plant-care/shared` | `packages/shared` | Shared enums |

Root scripts delegate with `npm run … -w <package>`.

## Recommended tools

- **Prisma Studio:** `npm run db:studio`
- **Swagger:** http://localhost:3001/api/docs (API running)
- **Vitest (web):** `npm run test -w @plant-care/web`
- **Jest (api):** `npm run test` from root

## Build all

```bash
npm run build
```

Order: shared → api → web. API build copies care-guide assets to `dist/`.

## See also

- [Monorepo architecture](../architecture/monorepo.md)
- [npm scripts](../reference/npm-scripts.md)
