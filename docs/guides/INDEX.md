# Complete guides — every aspect of Plant Care

> **Navigation:** [Master INDEX](../INDEX.md) · [Documentation map](../meta/documentation-map.md) · [Glossary](../meta/glossary.md)

These guides are the **deep, end-to-end explanations** of the product. Each guide covers one domain from multiple angles (what it is, how users experience it, how the API and database implement it, how to develop and operate it).

Use this hub when you need **understanding**, not just a single endpoint or screen. For narrow lookups, use the layer indexes ([API](../api/INDEX.md), [Web](../web/INDEX.md), [Database](../database/INDEX.md)).

---

## Who should read what

| You are… | Start here |
|----------|------------|
| New to the repo | [01 — Introduction & quick start](01-introduction-and-quick-start.md) |
| Day-to-day developer | [02 — Development handbook](02-development-handbook.md) |
| Implementing a feature | [03 — Architecture](03-architecture-and-system-design.md) → layer docs |
| DB / migrations | [04 — Data model](04-data-model-and-persistence.md) |
| API consumer or backend dev | [05 — API complete reference](05-api-complete-reference.md) |
| Care content author | [06 — Care guides system](06-care-guides-and-content.md) |
| Frontend dev | [07 — Web application](07-web-application.md) · [08 — UI components](08-ui-components-and-design.md) |
| DevOps / release | [13 — Operations & deployment](13-operations-deployment-and-quality.md) |
| Gardener / tester / PM | [10 — End-user product guide](10-end-user-product-guide.md) |
| QA / UAT | [14 — Product, QA & roadmap](14-product-qa-and-roadmap.md) |

---

## All guides

| # | Guide | Covers |
|---|--------|--------|
| 01 | [Introduction & quick start](01-introduction-and-quick-start.md) | Product vision, stack, first run, URLs, verification |
| 02 | [Development handbook](02-development-handbook.md) | Monorepo, workspaces, DB modes, scripts, conventions |
| 03 | [Architecture & system design](03-architecture-and-system-design.md) | Layers, modules, request flow, scheduling, diagnosis, security |
| 04 | [Data model & persistence](04-data-model-and-persistence.md) | All Prisma models, relations, seed, SQLite vs Postgres |
| 05 | [API complete reference](05-api-complete-reference.md) | Every REST module, auth, errors, Swagger |
| 06 | [Care guides & content](06-care-guides-and-content.md) | Templates, personalization, assets, species photos |
| 07 | [Web application](07-web-application.md) | Full route tree, pages, state, onboarding, social UI |
| 08 | [UI components & design](08-ui-components-and-design.md) | Layout, tasks, diagnosis, weather, engagement UI |
| 09 | [Integrations](09-integrations-and-external-services.md) | OpenAI, Stripe, weather, PlantNet, SMTP, storage |
| 10 | [End-user product guide](10-end-user-product-guide.md) | How to use every product area as a gardener |
| 11 | [Tutorials & walkthroughs](11-tutorials-and-walkthroughs.md) | Index of step-by-step procedures + gaps to add |
| 12 | [Mobile & clients](12-mobile-and-client-packaging.md) | Capacitor, PWA, device API URLs |
| 13 | [Operations & deployment](13-operations-deployment-and-quality.md) | Docker staging, CI, verify, Playwright, production |
| 14 | [Product, QA & roadmap](14-product-qa-and-roadmap.md) | UAT, tiers, roadmap, known limits |

---

## Feature → guide map

| Feature | Primary guide | Also see |
|---------|---------------|----------|
| Auth & accounts | 05, 10 | [api/authentication.md](../api/authentication.md) |
| Onboarding | 07, 10 | [web/pages/onboarding.md](../web/pages/onboarding.md) |
| Dashboard & garden score | 05, 07, 10 | [api/dashboard.md](../api/dashboard.md) |
| Plants & species browse | 04, 05, 07 | [api/species.md](../api/species.md) |
| Tasks & calendar | 03, 05, 10 | [architecture/scheduling.md](../architecture/scheduling.md) |
| Care instructions | 06, 08 | [care-guides/INDEX.md](../care-guides/INDEX.md) |
| Diagnosis & Dr. Plant | 03, 05, 09 | [architecture/diagnosis-pipeline.md](../architecture/diagnosis-pipeline.md) |
| Journal | 04, 05, 10 | [api/journal.md](../api/journal.md) |
| Weather | 05, 09, 10 | [integrations/weather.md](../integrations/weather.md) |
| Household / shared care | 04, 05, 07, 10 | [api/gardens.md](../api/gardens.md) |
| Community feed | 04, 05, 07, 10 | [api/community.md](../api/community.md) |
| Billing / Premium | 05, 09, 10 | [integrations/stripe.md](../integrations/stripe.md) |
| Mobile app | 12 | [web/mobile-packaging.md](../web/mobile-packaging.md) |

---

## Maintenance

When you ship a feature:

1. Update the relevant **guide** (sections + feature map row above).
2. Update the layer doc ([API](../api/INDEX.md), [Web](../web/INDEX.md), etc.).
3. Add a row to [docs/INDEX.md](../INDEX.md) feature map and [documentation-map.md](../meta/documentation-map.md).
