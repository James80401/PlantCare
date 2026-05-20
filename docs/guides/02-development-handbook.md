# Guide 02 — Development handbook

> **Navigation:** [Guides INDEX](INDEX.md) · [Getting started](../getting-started/INDEX.md)

## Monorepo structure

| Path | Package | Role |
|------|---------|------|
| `apps/api` | `@plant-care/api` | NestJS HTTP API |
| `apps/web` | `@plant-care/web` | Vite + React SPA |
| `packages/shared` | `@plant-care/shared` | Enums and plan limits consumed by API |
| `prisma/` | (root) | Schema, migrations, seed, species catalog data |
| `scripts/` | — | `verify.mjs`, integrations test, Docker helpers |
| `tests/e2e/` | — | Playwright |

Root `package.json` orchestrates workspaces. Always run `npm install` from **repo root**.

---

## Daily workflow

```bash
# Terminal 1
npm run dev:api

# Terminal 2
npm run dev:web

# After schema changes
npm run db:push
npm run db:seed    # if seed data changed

# Before PR
npm run build
npm run test
npm run verify
npm run uat:e2e
```

---

## Database: SQLite vs PostgreSQL

| Mode | Schema file | When |
|------|-------------|------|
| **SQLite** | `prisma/schema.prisma` | Default local dev |
| **PostgreSQL** | `prisma/schema.postgresql.prisma` | Docker staging, production |

Commands:

```bash
npm run db:generate              # SQLite client
npm run db:generate:postgres       # Postgres client (before staging verify on host)
npm run db:push                    # apply schema (dev)
npm run db:migrate                 # migrations (when used)
npm run db:studio                  # Prisma Studio GUI
```

Docker Postgres only (port **5433** on host):

```bash
npm run docker:postgres
# DATABASE_URL=postgresql://plantcare:plantcare@localhost:5433/plantcare?schema=public
```

**Important:** Keep both schema files in sync when adding models. Staging Docker uses Postgres; a missing relation on `schema.postgresql.prisma` will break `docker:build`.

---

## npm scripts (essential)

Full list: [reference/npm-scripts.md](../reference/npm-scripts.md).

| Script | Purpose |
|--------|---------|
| `dev:api` / `dev:web` | Hot reload dev servers |
| `build` | shared → api → web production build |
| `test` | API Jest unit tests |
| `verify` | End-to-end API smoke (`scripts/verify.mjs`) |
| `uat:e2e` | Playwright (set `UAT_WEB_URL`, `API_URL` for staging) |
| `test:integrations` | SMTP + OpenAI connectivity |
| `species:photos:*` | Fetch/download/sync species images |
| `docker:build` | Build staging images |
| `staging:up` / `staging:down` / `staging:smoke` | Docker stack |

---

## API development

- Entry: `apps/api/src/main.ts` — global prefix `api/v1`, Swagger, CORS, helmet, rate limit.
- New feature: add Nest module under `apps/api/src/<name>/`, register in `app.module.ts`.
- Auth: `@UseGuards(JwtAuthGuard)` + `@CurrentUser()` for `user.sub`.
- DTOs: `class-validator` in `dto/` folders; Swagger via `@ApiTags`.
- Tests: colocated `*.spec.ts`; run `npm run test -w @plant-care/api`.

---

## Web development

- Routes: `apps/web/src/App.tsx` — see [07 — Web application](07-web-application.md).
- API client: `apps/web/src/services/api.ts` — base URL from `VITE_API_BASE_URL`.
- Auth: `AuthContext` + `ProtectedRoute`; token in `localStorage`.
- Styling: Tailwind + component classes in `apps/web/src/components/`.
- Unit tests: `npm run test -w @plant-care/web` (Vitest).

---

## Shared package

`packages/shared` exports plan tiers, task types (subset), and limits. When adding Prisma enums used in API responses, update shared if the web needs them.

See [reference/shared-package.md](../reference/shared-package.md) for Prisma vs shared drift notes.

---

## Environment and secrets

- Never commit `.env` or `.env.staging`.
- Copy from `.env.example` / `.env.staging.example`.
- Staging web image bakes `VITE_API_BASE_URL` at **build** time — browser must reach that URL.

---

## Code conventions

- Match existing module layout (service + controller + dto).
- Prefer extending `tasks.service` / `scheduler.service` for schedule changes.
- Care copy changes: seed + `care-guides` templates — see [06 — Care guides](06-care-guides-and-content.md).
- Document new routes in `docs/web/routing.md` and `docs/reference/routes-quick-reference.md`.

---

## Git and documentation

When shipping a feature:

1. Code + tests
2. Update relevant **guide** (this folder)
3. Update layer INDEX + feature map in [docs/INDEX.md](../INDEX.md)
4. Run `verify` and targeted E2E

---

## Related docs

- [development-setup.md](../getting-started/development-setup.md)
- [environment.md](../getting-started/environment.md)
- [architecture/monorepo.md](../architecture/monorepo.md)
- [meta/for-ai-agents.md](../meta/for-ai-agents.md)
