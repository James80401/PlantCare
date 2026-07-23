# Guide 01 — Introduction & quick start

> **Navigation:** [Guides INDEX](INDEX.md) · [Getting started](../getting-started/INDEX.md)

## What Dr. Plant is

Dr. Plant helps people keep plants healthy with:

- **Automated care schedules** — watering, fertilizing, repotting, pest checks, and more, generated from species data and the plant’s environment (indoor/outdoor, light, pot size).
- **Actionable tasks** — a today-first dashboard and calendar, with instructions, skip feedback, snooze, and schedule explanations.
- **Species intelligence** — 440+ seeded species, browse/search, recommendations, and rich metadata (pests, hardiness, humidity).
- **Plant health** — photo diagnosis (rules + optional OpenAI), Dr. Plant chat, treatment plans, follow-up tasks.
- **Journal** — notes and photos per plant, with edit/delete.
- **Weather** — location-based advice and outdoor watering rain-skip hints.
- **Social** — household gardens (shared plants and tasks) and a community feed.

The app is a **monorepo**: NestJS API + React web (+ optional Capacitor mobile) sharing Prisma and content pipelines.

---

## Who uses which URL

| Environment | Web | API base |
|-------------|-----|----------|
| Local dev (Vite) | http://localhost:5173 | http://localhost:3001/api/v1 |
| Docker staging | http://localhost:8080 | http://localhost:3001/api/v1 |
| Production | Your `FRONTEND_URL` | Your API host + `/api/v1` |

Swagger (when API is running): `http://localhost:3001/api/docs`

---

## First-time setup (10 minutes)

### 1. Prerequisites

- **Node.js 22** (the supported runtime for the API, web tooling, and Capacitor CLI)
- **npm** (workspaces at repo root)
- **Git**
- Optional: **Docker Desktop** for staging stack and Postgres

### 2. Environment

```bash
cp .env.example .env
```

Minimum for local dev:

- `DATABASE_URL` — defaults to SQLite `file:./prisma/dev.db`
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — any long random strings
- `FRONTEND_URL` / `CORS_ORIGIN` — `http://localhost:5173`

Optional (enable features):

- `OPENAI_API_KEY` — Dr. Plant and LLM diagnosis
- `SMTP_*` — email verification and password reset
- `STRIPE_*` — subscriptions
- `PLANTNET_*`, `PERENUAL_*` — identify and species enrichment

Full table: [reference/environment-variables.md](../reference/environment-variables.md).

### 3. Database

```bash
npm run db:generate
npm run db:push
npm run db:seed      # 440+ species, care guides, images metadata
```

### 4. Run

```bash
npm run dev:api      # terminal 1
npm run dev:web      # terminal 2
```

Open http://localhost:5173, register, complete onboarding (or skip), add a plant.

### 5. Verify

```bash
npm run verify       # ~44 automated API checks
npm run uat:e2e      # Playwright UAT (needs dev servers)
```

---

## Mental model: three layers

```
Browser (React)  →  REST JSON  →  NestJS + Prisma  →  SQLite or PostgreSQL
                         ↓
              Integrations (OpenAI, Stripe, weather, email, …)
```

- **Web** never talks to the DB directly; it uses JWT + `fetch` via `apps/web/src/services/api.ts`.
- **API** owns business rules, scheduling, and authorization.
- **Prisma** is the single persistence layer; care guide content lives in DB seed + static assets.

---

## Default accounts and tiers

- New users register via `/auth/register`.
- Email verification is required unless you mark users verified in DB or use staging with relaxed flows.
- `ALL_USERS_PREMIUM=true` in env gives every user Premium limits (useful for dev/staging).
- Free tier limits (plants, identify/month) live in `@plant-care/shared` — see [reference/shared-package.md](../reference/shared-package.md).

---

## What to read next

| Goal | Document |
|------|----------|
| Daily development | [02 — Development handbook](02-development-handbook.md) |
| Understand modules | [03 — Architecture](03-architecture-and-system-design.md) |
| Use the app as a user | [10 — End-user guide](10-end-user-product-guide.md) |
| Deploy | [13 — Operations](13-operations-deployment-and-quality.md) |

---

## Troubleshooting first run

| Problem | Fix |
|---------|-----|
| Port 3001 in use | Stop other API or Docker staging API |
| Empty species / seed failed | `npm run db:seed` again; check `prisma/dev.db` |
| CORS errors | Match `CORS_ORIGIN` to web URL (5173 or 8080) |
| Email not sent | Expected without SMTP; verify user in DB for tests |

More: [getting-started/troubleshooting.md](../getting-started/troubleshooting.md).
