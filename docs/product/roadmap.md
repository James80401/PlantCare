# Plant Care roadmap

> **Status:** canonical consolidated roadmap, last consolidated 2026-06-03  
> **Navigation:** [Product INDEX](INDEX.md) · [Improvement recommendations](improvement-recommendations.md) · [UAT checklist](uat-checklist.md) · [Production sign-off](../operations/production-signoff.md)

This is the single roadmap source of truth for Plant Care. Older roadmap,
checklist, release, and Buddy phase documents remain useful as acceptance
criteria and runbooks, but their unchecked boxes are not automatically current.
When sources disagree, prefer this roadmap and update the source document the
next time that area is touched.

## How this roadmap was consolidated

| Source | New role |
|--------|----------|
| [improvement-recommendations.md](improvement-recommendations.md) | Research backlog, theme IDs, shipped status appendix, metrics |
| [improvement-checklist.md](improvement-checklist.md) | Acceptance-criteria archive for older core phases and implementation slices |
| [Guide 14 - Product, QA & roadmap](../guides/14-product-qa-and-roadmap.md) | QA hub and product maturity overview |
| [uat-checklist.md](uat-checklist.md) | Release verification matrix |
| [a11y-checklist.md](a11y-checklist.md) | Per-release accessibility gate |
| [production-signoff.md](../operations/production-signoff.md) | Production verification runbook |
| [private-online-setup.md](../operations/private-online-setup.md) | Private HTTPS deploy runbook |
| [google-play-closed-testing.md](google-play-closed-testing.md) | Android closed-testing runbook |
| [buddy/14-development-phases.md](../guides/buddy/14-development-phases.md) | Plant Buddy historical phases and remaining Buddy quality checklist |

## Status legend

| Status | Meaning |
|--------|---------|
| **Now** | Highest-confidence active priority or release blocker |
| **Next** | Clear product or quality work after release blockers |
| **Later** | Useful backlog that needs renewed product confirmation |
| **Ongoing** | Repeated release or QA activity |
| **Reconcile** | Documented elsewhere but status conflicts with shipped code/docs |

## Now: release readiness

| ID | Item | Status | Source details |
|----|------|--------|----------------|
| G3 | Complete production deploy sign-off against the real public URL | Now | Run `production:check`, `production:signoff`, optional production E2E, then record a sign-off artifact. See [production-signoff.md](../operations/production-signoff.md) and [uat-checklist.md](uat-checklist.md#f-pre-release-for-remote-testers). |
| G4 | Complete Android closed testing readiness | Now | Run mobile store/live checks, configure production `VITE_API_BASE_URL`, generate a signed AAB, upload to an internal or closed track, and confirm at least one tester install. See [google-play-closed-testing.md](google-play-closed-testing.md). |
| A11Y-QA | Run manual accessibility QA for the release | Ongoing | Keyboard pass, screen reader error announcements, 200% zoom, and focus-ring visibility. See [a11y-checklist.md](a11y-checklist.md). |
| PRIVATE-DEPLOY | Complete private HTTPS deployment path if this app is not public yet | Now, if applicable | Domain, VPS, DNS, Docker stack, Caddy, admin approval gate, and sign-off. See [private-online-setup.md](../operations/private-online-setup.md). |

## Next: core product and quality

| ID | Item | Status | Scope |
|----|------|--------|-------|
| H1 | Slim `GET /dashboard` and add cross-plant journal/diagnosis summaries | Next / Partial | Endpoint exists, but current roadmap sources still call out heavy payloads and missing cross-plant summaries. Primary paths: `apps/api/src/dashboard/`, `apps/web/src/pages/Dashboard*`, [api/dashboard.md](../api/dashboard.md). |
| CONTENT-1 | Expand species catalog coverage by category | Next | Older checklist still lists category expansion for houseplants, succulents/cacti, herbs/edibles, vegetables/fruits, ornamentals/shrubs/trees, and native/pollinator-friendly metadata. Keep separate from B3 attributes/filters, which newer docs mark done. |
| TASKTYPE-1 | Decide whether to support additional care task types | Next / Reconcile | Older roadmap mentions harvest, move, and flush tasks. Confirm product need before adding schema/API/UI work because current UAT and task guide coverage already support the shipped task set. |
| QUALITY-1 | Strengthen state and regression coverage | Next | Add or refresh tests for dashboard/API behavior, empty/loading/error states, warning/success contrast, and public preview/mobile workflow documentation. |
| DOCS-1 | Reconcile stale roadmap/checklist rows | Next | Update older Phase 5-8 checklist rows, Guide 14 maturity matrix, and recommendation theme bodies when working in those areas. Avoid adding new roadmap status in multiple places. |

## Later: backlog needing confirmation

These items appear in older roadmap sources or as partially overlapping ideas.
They should be product-confirmed before implementation because newer docs mark
nearby work as shipped.

| ID | Item | Status | Notes |
|----|------|--------|-------|
| JOURNAL-1 | Additional photo comparison and post-care observation prompts | Later / Reconcile | Growth measurements and timeline work are documented as shipped, but older checklist rows still mention photo compare views and useful observation prompts. |
| ENGAGE-1 | Per-plant milestone expansion | Later / Reconcile | `PlantMilestone` exists, but older milestone ideas include first leaf, first bloom, issue recovery, and propagation. Define which are still valuable. |
| SCORE-1 | Server-side garden score and streak calculations | Later / Reconcile | Dashboard and engagement work shipped, but older Phase 7 rows still mention server-side score/streak calculations. |
| DRPLANT-1 | Chat actions that create tasks or journal notes | Later | Dr. Plant context and intake are marked done in newer docs; explicit assistant actions remain a possible enhancement. |
| DATA-1 | Plant environment and care preference persistence refinements | Later / Reconcile | Some persistence rows are stale because related models already shipped; confirm remaining data gaps before adding models. |

## Plant Buddy lane

Plant Buddy is a secondary product lane. Do not mix Buddy phases with core app
phase numbers.

| ID | Item | Status | Scope |
|----|------|--------|-------|
| BUDDY-FEATURES | Buddy Phases 1-5 | Done | Core loop, customization, activities/quests, social Garden Town, seasonal/premium polish are checked complete in [buddy/14-development-phases.md](../guides/buddy/14-development-phases.md). |
| BUDDY-QA | Buddy testing and quality debt | Next, when Buddy is active | Add endpoint/unit coverage, Prisma integration tests, isolated event listener tests, accelerated journey timer test, midnight streak tests, mobile iOS/Android layout pass, Storybook stories if kept, and tone review. |
| BUDDY-ANALYTICS | Server analytics aggregates | Later | Buddy Phase 5 notes client tracking exists and server aggregates are still TBD. |

## Not active roadmap items

The following items are treated as shipped or superseded unless a new issue
reopens them:

- Task skip feedback, snooze, schedule suggestions, and adaptive weather rules.
- Structured task care guide copy and beginner/advanced instruction UI.
- One-shot diagnosis on the Health tab, Dr. Plant context enrichment, structured intake, and diagnosis follow-up tasks.
- Journal photos, measurements, aggregate timeline endpoint, and persisted milestones.
- Add-plant notes/care preview, settings care preferences, plant delete flow.
- Community post images, pagination, and household journal permission toggle.
- FCM HTTP v1, richer push bodies/deep links, production sign-off scripts, and mobile store-check scripts.
- Accessibility foundation: skip link, form alerts, dialog focus, task panel labels, and Playwright landmarks test.

## Maintenance rules

1. Update this file first when roadmap priority changes.
2. Keep detailed acceptance criteria in the supporting checklist or runbook, then link to it from this file.
3. Do not add a second "current roadmap" section to another doc. Link back here instead.
4. If an unchecked item in an older checklist is already shipped, mark it done or move it to this file as **Reconcile** with a note.
5. Use distinct labels when referring to phases: Core Phase, Buddy Phase, or Deploy Phase.
