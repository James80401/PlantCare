# Guide 14 — Product, QA & roadmap

> **Navigation:** [Guides INDEX](INDEX.md) · [Product docs](../product/improvement-checklist.md)

## Product vision

Plant Care aims to be a **daily companion** for plant owners: proactive schedules, understandable instructions, and help when something goes wrong — with optional social layers (household + community).

---

## Plan tiers

| Tier | Typical limits |
|------|----------------|
| **FREE** | Cap on plant count and monthly identifies (`FREE_PLANT_LIMIT`, `FREE_IDENTIFY_MONTHLY_LIMIT` in shared package) |
| **PREMIUM** | Higher/unlimited limits via Stripe |

Dev/staging: set `ALL_USERS_PREMIUM=true` to bypass limits.

Doc: [user-guide/subscription.md](../user-guide/subscription.md), [reference/shared-package.md](../reference/shared-package.md).

---

## QA artifacts

| Doc | Audience |
|-----|----------|
| [uat-checklist.md](../product/uat-checklist.md) | Full UAT matrix |
| [tester-5-minute.md](../product/tester-5-minute.md) | Quick smoke for testers |
| [improvement-recommendations.md](../product/improvement-recommendations.md) | Prioritized improvement backlog (research-backed) |
| [improvement-checklist.md](../product/improvement-checklist.md) | Roadmap / acceptance ideas |

---

## Automated QA status

Run before release:

```bash
npm run build
npm run verify
npm run uat:e2e
npm run staging:smoke   # when Docker available
```

Species search on Postgres uses case-insensitive `contains` (`species-name-filter.ts`). Rebuild staging API after changes, then run `staging:smoke`.

---

## Feature maturity matrix

| Feature | Status | Notes |
|---------|--------|-------|
| Auth & email | Shipped | SMTP optional |
| Onboarding | Shipped | E2E covered |
| Dashboard API | Shipped | Rich UI |
| Tasks & calendar | Shipped | Snooze, explanations, suggestions |
| Species browse + metadata | Shipped | 320 species |
| Diagnosis + Dr. Plant | Shipped | Needs OpenAI for full LLM |
| Journal | Shipped | PATCH/DELETE |
| Weather | Shipped | Location required |
| Household / share | Shipped | API + UI |
| Community | Shipped | Posts, comments, and likes |
| Mobile Capacitor | Partial | Scripts exist; store TBD |
| Push FCM | Roadmap | Device tokens only |

---

## Roadmap themes (P3+)

From improvement checklist and conversation history:

1. **Push notifications** — FCM, daily reminders to devices.
2. **Capacitor store release** — iOS/Android packaging.
3. **Community polish** — comments, likes UI.
4. **Household** — email invite links, permission refinements.
5. **Production deploy** — managed Postgres, CDN, monitoring.

---

## Known limitations

- Dr. Plant requires OpenAI (or limited rule-based diagnosis without it).
- Email flows need SMTP in production.
- Docker seed imports species metadata from API source path — keep Dockerfile in sync.
- `packages/shared` TaskType enum may lag Prisma — prefer Prisma as source of truth in API.

---

## How to file doc updates with features

1. Update this matrix.
2. Update [docs/INDEX.md](../INDEX.md) feature map.
3. Add tutorial or user-guide section.
4. Extend relevant **guide** in `docs/guides/`.

---

## Related

- [10 — End-user guide](10-end-user-product-guide.md)
- [11 — Tutorials](11-tutorials-and-walkthroughs.md)
- [13 — Operations](13-operations-deployment-and-quality.md)
