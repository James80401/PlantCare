# Guide 11 — Tutorials & walkthroughs

> **Navigation:** [Guides INDEX](INDEX.md) · [Tutorials INDEX](../tutorials/INDEX.md)

Step-by-step procedures live in **`docs/tutorials/`**. This guide indexes them and notes **gaps** to add.

---

## For developers

| Tutorial | Steps |
|----------|--------|
| [first-time-developer.md](../tutorials/first-time-developer.md) | Clone, env, DB, run API/web, verify |

---

## For gardeners / testers

| Tutorial | Steps |
|----------|--------|
| [first-time-user.md](../tutorials/first-time-user.md) | Register, first login |
| [adding-a-plant.md](../tutorials/adding-a-plant.md) | Search species, create plant |
| [completing-tasks.md](../tutorials/completing-tasks.md) | Complete, skip, snooze |
| [reading-care-instructions.md](../tutorials/reading-care-instructions.md) | Open instruction modal |
| [outdoor-vs-indoor-plants.md](../tutorials/outdoor-vs-indoor-plants.md) | Location effects on tasks |
| [changing-plant-location.md](../tutorials/changing-plant-location.md) | Reschedule behavior |
| [using-dr-plant-chat.md](../tutorials/using-dr-plant-chat.md) | Chat thread |
| [one-shot-diagnosis.md](../tutorials/one-shot-diagnosis.md) | Diagnose from photo |
| [journal-and-notes.md](../tutorials/journal-and-notes.md) | Journal CRUD |

---

## Recommended new tutorials

| Topic | Suggested file | Why |
|-------|----------------|-----|
| Onboarding wizard | `onboarding-wizard.md` | New user flow |
| Browse & recommendations | `browse-species.md` | P1E species UX |
| Schedule suggestions | `schedule-suggestions.md` | Adaptive scheduling |
| Household invite | `household-invite.md` | Care Share |
| Community post | `community-post.md` | Social feed |
| Garden score insights | `garden-score.md` | Engagement |
| 5-minute tester | (exists) [tester-5-minute.md](../product/tester-5-minute.md) | Quick QA |

---

## Automated walkthroughs

| Tool | Command | Covers |
|------|---------|--------|
| Verify script | `npm run verify` | API contract smoke |
| Playwright | `npm run uat:e2e` | UI flows desktop + mobile |
| Onboarding only | `tests/e2e/onboarding.spec.ts` | Wizard → first plant |

Doc: [operations/testing.md](../operations/testing.md).

---

## Learning path (recommended order)

1. [first-time-user.md](../tutorials/first-time-user.md)
2. [adding-a-plant.md](../tutorials/adding-a-plant.md)
3. [completing-tasks.md](../tutorials/completing-tasks.md)
4. [reading-care-instructions.md](../tutorials/reading-care-instructions.md)
5. [one-shot-diagnosis.md](../tutorials/one-shot-diagnosis.md) or [using-dr-plant-chat.md](../tutorials/using-dr-plant-chat.md)

---

## Related

- [10 — End-user guide](10-end-user-product-guide.md)
- [14 — Product & QA](14-product-qa-and-roadmap.md)
