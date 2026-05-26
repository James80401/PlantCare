# Plant Care

A full-stack plant care companion: personalized watering and care schedules, species catalog, health diagnosis (rules + AI), journal, weather-aware advice, household sharing, and a community feed.

> **Documentation:** **[ReadMe.md](ReadMe.md)** · **[docs/INDEX.md](docs/INDEX.md)** (hub) · **[docs/application-overview.md](docs/application-overview.md)** (full-stack overview)

**Documentation:** start at **[docs/INDEX.md](docs/INDEX.md)** (hub) or **[docs/guides/INDEX.md](docs/guides/INDEX.md)** (deep guides for every aspect).

---

## Stack

| Layer | Technology |
|-------|------------|
| API | NestJS 10, Prisma, JWT auth |
| Web | React 19, Vite, Tailwind, React Router |
| Database | SQLite (local dev) · PostgreSQL (Docker staging / production) |
| Mobile | Capacitor (optional native shells) |
| Shared | `@plant-care/shared` — plan limits and enums |

---

## Quick start (local development)

```bash
cp .env.example .env    # fill secrets as needed
npm install
npm run db:generate && npm run db:push && npm run db:seed
npm run dev             # API :3001 + web :5173 together
npm run dev:api         # http://localhost:3001 only
npm run dev:web         # http://localhost:5173 only
```

| URL | Purpose |
|-----|---------|
| http://localhost:5173 | Web app (Vite dev) |
| http://localhost:3001/api/v1 | REST API |
| http://localhost:3001/api/docs | Swagger |

Verify the install:

```bash
npm run verify          # API + DB smoke checks
npm run uat:e2e         # Playwright (desktop + mobile)
```

---

## Docker staging (production-like)

```bash
cp .env.staging.example .env.staging
npm run docker:build    # build API + web images
npm run staging:up      # Postgres + API + nginx web
# Web http://localhost:8080 · API http://localhost:3001/api/v1
npm run staging:smoke   # up + verify + Playwright against :8080
npm run staging:down
```

See [docs/guides/13-operations-deployment-and-quality.md](docs/guides/13-operations-deployment-and-quality.md).

## Production + Google Play (private beta)

```bash
cp .env.production.example .env.production   # edit domain + secrets
npm run production:check
npm run production:up   # on VPS behind HTTPS reverse proxy
```

Android: [docs/guides/15-production-deploy-and-android.md](docs/guides/15-production-deploy-and-android.md)

---

## Repository layout

```
apps/api/           NestJS REST API
apps/web/           React SPA
packages/shared/    Shared types and limits
prisma/             Schema, seed (320+ species), care guide data
scripts/            verify.mjs, staging deploy, species photos
tests/e2e/          Playwright UAT
docs/               All documentation (guides, API, architecture, …)
```

---

## Major product areas

- **Garden dashboard** — today’s care, overdue tasks, garden score, weather, schedule suggestions
- **Plants** — add from catalog or identify (PlantNet), profile tabs (overview, care, tasks, journal, health)
- **Tasks & calendar** — complete, skip (with feedback), snooze, instructions, “why this date”
- **Species browse** — filters, recommendations, growing metadata
- **Health** — one-shot diagnosis, per-plant Dr. Plant chat (garden cards + profile Health tab), follow-up tasks
- **Journal** — notes and photos per plant
- **Household** — shared gardens, invites, plant sharing, activity feed
- **Community** — posts with optional species/plant context
- **Settings** — location, notifications, weather advice
- **Premium** — Stripe checkout (optional; `ALL_USERS_PREMIUM` for dev/staging)

---

## Documentation map

| Need | Go to |
|------|--------|
| **Complete guides (every aspect)** | [docs/guides/INDEX.md](docs/guides/INDEX.md) |
| Master index & learning paths | [docs/INDEX.md](docs/INDEX.md) |
| Run locally | [docs/getting-started/quick-start.md](docs/getting-started/quick-start.md) |
| API modules | [docs/api/INDEX.md](docs/api/INDEX.md) |
| Deploy | [docs/operations/deployment.md](docs/operations/deployment.md) |
| UAT / testers | [docs/product/tester-5-minute.md](docs/product/tester-5-minute.md) |

---

## Agent / contributor workflow

After finishing work: **commit**, **push**, and **sync to `main`**. See [AGENTS.md](AGENTS.md) and `.cursor/rules/workflow.mdc`.

---

## License

Private project — see repository owner for terms.
