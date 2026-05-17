# Plant Care — Master Index (Tutorial & Instructions)

> **Navigation:** [ReadMe](../ReadMe.md) · [Documentation map](meta/documentation-map.md) · [For AI agents](meta/for-ai-agents.md) · [Glossary](meta/glossary.md)

This document is the **primary tutorial and instructions hub** for Plant Care. Use the tables below to jump to any layer; each linked folder has its own **INDEX.md** with deeper links.

---

## How to use this documentation

### For humans

1. **New to the project?** → [Getting started](getting-started/INDEX.md) → [Quick start](getting-started/quick-start.md)
2. **Using the app?** → [User guide](user-guide/INDEX.md) or [Tutorials](tutorials/INDEX.md)
3. **Changing code?** → [Architecture](architecture/INDEX.md) + the layer you touch ([API](api/INDEX.md) / [Web](web/INDEX.md) / [Database](database/INDEX.md))
4. **Stuck?** → [Troubleshooting](getting-started/troubleshooting.md)

### For AI agents

1. Read [meta/for-ai-agents.md](meta/for-ai-agents.md) first
2. Resolve the user’s **layer** (UI, API, DB, content, ops) from [meta/documentation-map.md](meta/documentation-map.md)
3. Open that layer’s **INDEX.md**, then the narrowest child doc
4. Use [reference/file-tree.md](reference/file-tree.md) only after the conceptual doc

---

## Learning paths

### Path A — Run locally (developer)

| Step | Document |
|------|----------|
| 1 | [Quick start](getting-started/quick-start.md) |
| 2 | [Environment variables](getting-started/environment.md) |
| 3 | [Database setup](getting-started/database.md) |
| 4 | [Running services](getting-started/running-services.md) |
| 5 | [Verification scripts](operations/scripts.md) |

### Path B — Use the product (gardener / tester)

| Step | Document |
|------|----------|
| 1 | [First-time user](tutorials/first-time-user.md) |
| 2 | [Adding a plant](tutorials/adding-a-plant.md) |
| 3 | [Completing tasks](tutorials/completing-tasks.md) |
| 4 | [Care instructions](tutorials/reading-care-instructions.md) |
| 5 | [Outdoor vs indoor](tutorials/outdoor-vs-indoor-plants.md) |
| 6 | [Dr. Plant chat](tutorials/using-dr-plant-chat.md) |

### Path C — Implement a feature (full stack)

| Step | Document |
|------|----------|
| 1 | [System overview](architecture/system-overview.md) |
| 2 | [Request flow](architecture/request-flow.md) |
| 3 | Relevant [API](api/INDEX.md) + [Web](web/INDEX.md) module docs |
| 4 | [Schema](database/schema-reference.md) if persistence changes |
| 5 | [Testing](operations/testing.md) |

---

## Top-level documentation index

| Layer | INDEX | What you’ll find |
|-------|-------|------------------|
| **Getting started** | [getting-started/INDEX.md](getting-started/INDEX.md) | Install, env, DB, email, run, troubleshoot |
| **Tutorials** | [tutorials/INDEX.md](tutorials/INDEX.md) | Step-by-step procedures |
| **User guide** | [user-guide/INDEX.md](user-guide/INDEX.md) | Screens, flows, UX |
| **Architecture** | [architecture/INDEX.md](architecture/INDEX.md) | Design, pipelines, security |
| **API** | [api/INDEX.md](api/INDEX.md) | NestJS modules, endpoints, DTOs |
| **Web** | [web/INDEX.md](web/INDEX.md) | Routes, pages, components, API client |
| **Database** | [database/INDEX.md](database/INDEX.md) | Prisma models, seed, migrations |
| **Care guides** | [care-guides/INDEX.md](care-guides/INDEX.md) | Templates, personalization, assets |
| **Integrations** | [integrations/INDEX.md](integrations/INDEX.md) | OpenAI, SMTP, Stripe, PlantNet, … |
| **Operations** | [operations/INDEX.md](operations/INDEX.md) | Deploy, CI, scripts, testing |
| **Product** | [product/improvement-checklist.md](product/improvement-checklist.md) | Roadmap checklist for UX, care intelligence, data, and engagement improvements |
| **Reference** | [reference/INDEX.md](reference/INDEX.md) | Scripts, env table, routes, file tree |
| **Meta** | [meta/INDEX.md](meta/INDEX.md) | Doc map, AI guide, glossary |

---

## Feature → documentation map

| Feature | User doc | Tutorial | API | Web | Deep dive |
|---------|----------|----------|-----|-----|-----------|
| Register / login | [user-guide/landing-and-auth.md](user-guide/landing-and-auth.md) | [tutorials/first-time-user.md](tutorials/first-time-user.md) | [api/authentication.md](api/authentication.md) | [web/pages/auth.md](web/pages/auth.md) | [architecture/auth-and-security.md](architecture/auth-and-security.md) |
| Garden dashboard | [user-guide/garden-dashboard.md](user-guide/garden-dashboard.md) | — | [api/plants.md](api/plants.md) | [web/pages/dashboard.md](web/pages/dashboard.md) | — |
| Add plant | [user-guide/plant-profile.md](user-guide/plant-profile.md) | [tutorials/adding-a-plant.md](tutorials/adding-a-plant.md) | [api/plants.md](api/plants.md) | [web/pages/add-plant.md](web/pages/add-plant.md) | [architecture/scheduling.md](architecture/scheduling.md) |
| Care tasks | [user-guide/task-calendar.md](user-guide/task-calendar.md) | [tutorials/completing-tasks.md](tutorials/completing-tasks.md) | [api/tasks.md](api/tasks.md) | [web/pages/tasks.md](web/pages/tasks.md) | [architecture/scheduling.md](architecture/scheduling.md) |
| Task instructions | — | [tutorials/reading-care-instructions.md](tutorials/reading-care-instructions.md) | [api/tasks.md](api/tasks.md#instructions) | [web/components/task-instructions.md](web/components/task-instructions.md) | [care-guides/INDEX.md](care-guides/INDEX.md) |
| Care guide on profile | [user-guide/plant-profile.md](user-guide/plant-profile.md) | [tutorials/outdoor-vs-indoor-plants.md](tutorials/outdoor-vs-indoor-plants.md) | [api/plants.md](api/plants.md#care-overview) | [web/pages/plant-profile.md](web/pages/plant-profile.md) | [care-guides/growing-environment.md](care-guides/growing-environment.md) |
| Change location | — | [tutorials/changing-plant-location.md](tutorials/changing-plant-location.md) | [api/plants.md](api/plants.md#update) | [web/pages/plant-profile.md](web/pages/plant-profile.md) | [care-guides/growing-environment.md](care-guides/growing-environment.md) |
| Dr. Plant chat | — | [tutorials/using-dr-plant-chat.md](tutorials/using-dr-plant-chat.md) | [api/diagnosis.md](api/diagnosis.md) | [web/components/dr-plant-chat.md](web/components/dr-plant-chat.md) | [architecture/diagnosis-pipeline.md](architecture/diagnosis-pipeline.md) |
| One-shot diagnosis | — | [tutorials/one-shot-diagnosis.md](tutorials/one-shot-diagnosis.md) | [api/diagnosis.md](api/diagnosis.md) | [web/components/diagnosis-result.md](web/components/diagnosis-result.md) | [integrations/openai.md](integrations/openai.md) |
| Journal | — | [tutorials/journal-and-notes.md](tutorials/journal-and-notes.md) | [api/journal.md](api/journal.md) | [web/pages/plant-profile.md](web/pages/plant-profile.md) | — |
| Settings / weather | [user-guide/settings.md](user-guide/settings.md) | — | [api/users.md](api/users.md) | [web/pages/settings.md](web/pages/settings.md) | [integrations/weather.md](integrations/weather.md) |
| Premium / billing | [user-guide/subscription.md](user-guide/subscription.md) | — | [api/billing.md](api/billing.md) | [web/pages/subscription.md](web/pages/subscription.md) | [integrations/stripe.md](integrations/stripe.md) |

---

## Repository layout (conceptual)

```
PlantCare/
├── ReadMe.md                 ← Project entry (links here)
├── docs/INDEX.md             ← You are here
├── apps/
│   ├── api/                  NestJS REST API
│   └── web/                  React + Vite SPA
├── packages/shared/          Shared enums & limits
├── prisma/                   Schema, seed, catalog data
├── scripts/                  verify.mjs, test-integrations.mjs
└── docker-compose.yml        Optional PostgreSQL
```

Full path index: [reference/file-tree.md](reference/file-tree.md)

---

## Default URLs & prefixes

| Item | Value |
|------|--------|
| Web | `http://localhost:5173` |
| API base | `http://localhost:3001/api/v1` |
| Swagger | `http://localhost:3001/api/docs` |
| Static uploads | `/uploads/` |
| Care guide SVGs | `/care-guides/images/` |
| Care guide photos | `/care-guides/photos/` |

Route quick reference: [reference/routes-quick-reference.md](reference/routes-quick-reference.md)

---

## Maintenance

When you add a feature:

1. Update the relevant layer **INDEX.md**
2. Add or extend a leaf doc in that folder
3. Add a row to the **Feature map** (above) and [documentation-map.md](meta/documentation-map.md)
4. Link from [reference/file-tree.md](reference/file-tree.md) if new files are introduced
