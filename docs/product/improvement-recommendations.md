# Plant Care improvement recommendations

> **Status:** researched backlog (last updated 2026-05-26)  
> **Navigation:** [Product INDEX](INDEX.md) · [Improvement checklist](improvement-checklist.md) · [Feature availability](../reference/feature-availability.md)

This document captures **research-backed recommendations** for improving Plant Care: user value, content quality, reliability, and release readiness. It complements the living [improvement-checklist.md](improvement-checklist.md), which remains the implementation queue with acceptance checks.

---

## Product north star

Plant Care should feel like a **personalized daily plant assistant**: it tells users what matters today, explains why each action matters, adapts to their plants and environment, and makes progress visible over time.

Recommendations below are **additive** — they assume the foundation already shipped (mobile shell, dashboard, structured care overview, Dr. Plant per plant, task feedback, schedule suggestions, weather advice, buddy, community, demo seed, Playwright UAT).

---

## How to use this document

| Use this doc when… | Use the checklist when… |
|--------------------|-------------------------|
| Prioritizing the next product slice by impact vs effort | Executing a scoped section with explicit acceptance checks |
| Onboarding PM, QA, or agents to gaps across the repo | Tracking checkbox completion for a known phase |
| Debating “what should we build next?” | Defining “done” for a single feature slice |

### Priority legend

| Label | Meaning |
|-------|---------|
| **P0** | Blocks production trust, safety, or core promise |
| **P1** | High user value; should be in the next 1–2 delivery cycles |
| **P2** | Meaningful polish or scale; schedule when P0/P1 clear |
| **P3** | Backlog, content programs, or nice-to-have |

### Effort sizing

| Size | Typical scope |
|------|----------------|
| **S** | 1–3 days, mostly one layer (web or API) |
| **M** | ~1 week, cross-stack or seed/content |
| **L** | Multi-week program (catalog, FCM migration, major API shape) |

### Labels

- **Quick win** — Small change, visible UX or doc fix.
- **Strategic bet** — Larger investment; unlocks multiple follow-ups.

---

## Top 10 recommendations

| ID | Title | User value | Effort | Priority | Area |
|----|-------|------------|--------|----------|------|
| **G1** | FCM HTTP v1 + real device push verification | Trustworthy reminders on phones | M | P1 | Mobile / ops |
| **G3** | Production deploy sign-off | Ship-ready hosting and UAT | S | P1 | Ops |
| **D2** | Growth measurements UI + photo compare polish | Credible plant progress story | M | P2 | Journal |
| **B3** | Species catalog Phase 3 attributes + filters | Browse and recommendations match guide depth | L | P2 | Species / content |
| **A5** | Optional completion notes on tasks | Richer journal and Dr. Plant context | S | P2 | Core care loop |
| **H1** | Slim dashboard API aggregates | Faster dashboard; less client fanout | M | P2 | API |
| **F1** | Community post images | Social posts match user expectations | M | P2 | Community |
| **C4** | Enrich Dr. Plant with skips, weather, care summary | Chat advice matches live plant state | M | P2 | Diagnosis |
| **G2** | Richer push (overdue, multi-task, deep links) | Mobile reminders feel actionable | M | P2 | Mobile / ops |
| **H3** | E2E for structured instructions + snooze | Regression safety on care UI | S | P2 | Quality |

---

## Current strengths (shipped foundation)

Sections 0–9 of the [improvement-checklist](improvement-checklist.md) are largely complete. Notable shipped capabilities:

- **Mobile-first shell** — Bottom nav, safe areas, Capacitor packaging path.
- **Garden dashboard** — Greeting, metrics, attention cards, week preview, weather panel, engagement milestones.
- **Plant profile IA** — Overview, Care, Tasks, Journal, Health tabs; edit details; Dr. Plant deep links.
- **Structured plant care overview** — Eleven topics plus season/weather/growth tailoring; beginner/advanced toggle on Care tab ([`plant-care-overview.builder.ts`](../../apps/api/src/care-guides/plant-care-overview.builder.ts)).
- **Task loop** — Complete, skip with reasons, snooze (1/3/7 days), instructions modal, schedule suggestions with user approval.
- **Adaptive scheduling** — Wet-soil skip shifts watering; dry-soil/stressed **complete** feedback can suggest faster watering; rain skip and **cached-forecast auto-postpone** for outdoor watering; dormant fertilizer suggestions; explanations ([`scheduler.service.ts`](../../apps/api/src/scheduler/scheduler.service.ts)).
- **Complete-time task feedback** — Optional reasons on `PATCH /tasks/:id/complete` (WATER quick feedback in web); persisted as `TaskFeedback` with `action: COMPLETE`.
- **Structured task care guides (B1)** — All 12 `TaskType` seeds include `whyItMatters`, `beginnerBody`, `advancedBody`, optional `warnings`; ~3,852 guides; verifier asserts coverage ([`care-guide-templates.ts`](../../prisma/data/care-guide-templates.ts), [`verify-care-guides.mjs`](../../scripts/verify-care-guides.mjs)).
- **Weather** — On-demand 7-day advice, per-plant lines, integration into care overview when cache exists.
- **Diagnosis** — One-shot API, Dr. Plant chat, follow-up HEALTH_CHECK tasks, recovery status.
- **Journal** — CRUD, measurements on API, timeline on profile.
- **Species** — 320 species, ~3,852 care guides (12 task types × species + generics), browse and filters.
- **Social** — Household share, community posts/comments/likes.
- **Plant Buddy** — Progression, shop, quests (separate lane; see theme I).
- **Quality** — `npm run verify`, Playwright UAT, demo garden seed (`demo@plantcare.local`).

### Shipped vs checklist drift

Some **Phase 4–7** checklist items are open in the checklist but **partially implemented** in code. This doc marks them **Partial** in the appendix. Examples:

| Topic | Checklist | Code reality |
|-------|-----------|--------------|
| Task snooze | Phase 4 open; UAT says “not implemented” | Shipped: `PATCH /tasks/:id/snooze`, [`TaskRow.tsx`](../../apps/web/src/components/tasks/TaskRow.tsx) |
| Skip feedback | Phase 4 open | Shipped: `TaskFeedback` on skip |
| Schedule suggestions | Phase 4 open | Shipped: Section 8 complete |
| Structured care copy | Section 3 noted future work | Shipped on profile and in seeded task guides (B1, 2026-05) |

**Recommendation H4:** Update [uat-checklist.md](uat-checklist.md), [api/diagnosis.md](../api/diagnosis.md), and Phase 4 bullets when touching those areas.

---

## Theme A — Core care loop

**Problem:** Users complete or skip tasks, but the app does not fully close the loop from feedback → schedule → visible explanation. Skip reasons are collected; completion-time signals and automatic weather-driven postpones are incomplete.

**Opportunity:** Make schedules feel **earned and explainable**, increasing trust in due dates and Dr. Plant advice.

| ID | Recommendation | Type | Effort | Priority | Key paths |
|----|----------------|------|--------|----------|-----------|
| **A1** | ~~Complete-time feedback + dry-soil scheduler rules~~ **Done (2026-05)** | — | — | — | [`complete-task-feedback.dto.ts`](../../apps/api/src/tasks/dto/complete-task-feedback.dto.ts), [`scheduler.service.ts`](../../apps/api/src/scheduler/scheduler.service.ts) |
| **A2** | ~~Auto-postpone outdoor watering from cached weather~~ **Done (2026-05)** | — | — | — | [`autoPostponeOutdoorWateringFromWeather`](../../apps/api/src/scheduler/scheduler.service.ts) |
| **A3** | Surface **skip reason**, optional note, and **schedule explanation** on profile Tasks tab and timeline | Quick win | S | P2 | [`PlantTasksTab.tsx`](../../apps/web/src/pages/plant-profile/PlantTasksTab.tsx), [`shared.tsx`](../../apps/web/src/pages/plant-profile/shared.tsx) |
| **A4** | **Unify skip UX** — single flow that encourages feedback without hiding one-tap skip; avoid divergent data quality between dashboard and profile | Quick win | S | P2 | [`TaskRow.tsx`](../../apps/web/src/components/tasks/TaskRow.tsx) |
| **A5** | Optional **completion notes** (one line) on complete — stored for journal/Dr. Plant context | Quick win | S | P2 | tasks API + complete UI |

**Suggested slice (2–3 days):** A3 + A4 + H4 doc fix for snooze.

---

## Theme B — Care content and instructions

**Problem (resolved for B1/B2):** Task instructions now use the same structured section shape as the profile Care tab. Ongoing work is catalog depth (B3), not flat copy.

**Opportunity:** Extend species metadata and discovery filters so browse and recommendations match guide quality.

| ID | Recommendation | Type | Effort | Priority | Key paths |
|----|----------------|------|--------|----------|-----------|
| **B3** | **Species catalog Phase 3** — difficulty, zones, pests, dormancy, filters, recommendations ([checklist Phase 3](improvement-checklist.md)) | Strategic bet | L | P2 | [`apps/api/src/species/`](../../apps/api/src/species/) |

**Shipped (2026-05):** **B1** — all 12 task types in [`care-guide-templates.ts`](../../prisma/data/care-guide-templates.ts); **B2** — [`verify-care-guides.mjs`](../../scripts/verify-care-guides.mjs) asserts structured fields on every generic guide. Re-seed with `npx tsx prisma/seed-care-guides.ts` after template edits.

**Reference:** [Guide 06 — Care guides](../guides/06-care-guides-and-content.md), [`TaskInstructionsModal.tsx`](../../apps/web/src/components/TaskInstructionsModal.tsx) (already uses [`StructuredCareSectionCard`](../../apps/web/src/components/care/StructuredCareSectionCard.tsx)).

---

## Theme C — Diagnosis and Dr. Plant

**Problem:** Health help is split between chat (discoverable) and one-shot diagnosis (API-only create). Follow-up tasks are manual; diagnosis photos and notes are underused in UI.

**Opportunity:** Guided recovery from problems, with clear paths from symptom → plan → tasks → resolution.

| ID | Recommendation | Type | Effort | Priority | Key paths |
|----|----------------|------|--------|----------|-----------|
| **C1** | **One-shot diagnosis create UI** on Health tab (prominent, with photo preview) — today [feature-availability](../reference/feature-availability.md) marks create as API-only | Strategic bet | M | P1 | [`PlantHealthTab.tsx`](../../apps/web/src/pages/plant-profile/PlantHealthTab.tsx), [`DiagnosisForm.tsx`](../../apps/web/src/components/DiagnosisForm.tsx) |
| **C2** | **Auto recovery tasks** from diagnosis `immediateActions` with user confirm (not only manual follow-up buttons) | Strategic bet | M | P1 | [`diagnosis.service.ts`](../../apps/api/src/diagnosis/diagnosis.service.ts) |
| **C3** | **Persist follow-up `note`**; show **`imageUrl`** on diagnosis history cards | Quick win | S | P2 | [`follow-up-task.dto.ts`](../../apps/api/src/diagnosis/dto/follow-up-task.dto.ts), [`DiagnosisResult.tsx`](../../apps/web/src/components/DiagnosisResult.tsx) |
| **C4** | Enrich **Dr. Plant prompts** with recent skips, weather line, structured care summary | Strategic bet | M | P2 | [`diagnosis-chat.service.ts`](../../apps/api/src/diagnosis/diagnosis-chat.service.ts) |
| **C5** | **Structured pre-diagnosis intake** (symptom duration, recent care/env changes, pest visibility) | Strategic bet | L | P3 | diagnosis module + schema |

**Suggested slice:** C1 + C3 (visible diagnosis + photos).

---

## Theme D — Journal and plant progress

**Problem:** API supports photos and measurements; profile journal UX is text-first and blocks photo-only creates. Timeline is client-merged from plant payload.

**Opportunity:** A credible “plant story” increases retention and Dr. Plant accuracy.

| ID | Recommendation | Type | Effort | Priority | Key paths |
|----|----------------|------|--------|----------|-----------|
| **D1** | Journal **photo preview**, **photo-only** submit, **show existing photo** on edit, confirm delete | Quick win | S | P1 | [`PlantJournalTab.tsx`](../../apps/web/src/pages/plant-profile/PlantJournalTab.tsx), [`PlantProfileContext.tsx`](../../apps/web/src/pages/plant-profile/PlantProfileContext.tsx) |
| **D2** | **Growth measurements** UI + optional photo compare over time | Strategic bet | M | P2 | journal API, timeline |
| **D3** | Optional **`GET /plants/:id/timeline`** aggregate endpoint | Strategic bet | M | P3 | [`plants.service.ts`](../../apps/api/src/plants/plants.service.ts) |
| **D4** | Persist **`PlantMilestone`** instead of only ephemeral dashboard defs | Strategic bet | M | P3 | [`dashboard.service.ts`](../../apps/api/src/dashboard/dashboard.service.ts) |

**Suggested slice:** D1 only.

---

## Theme E — Onboarding, settings, and discovery

**Problem:** Onboarding captures preferences that are hard to change later; add-plant omits fields the API already accepts.

**Opportunity:** First-run and settings feel coherent with care guide detail levels and recommendations.

| ID | Recommendation | Type | Effort | Priority | Key paths |
|----|----------------|------|--------|----------|-----------|
| **E1** | **Notes** + **toxicity / care preview** on Add Plant wizard | Quick win | S | P2 | [`AddPlantWizard.tsx`](../../apps/web/src/pages/AddPlantWizard.tsx) |
| **E2** | **Settings** editors for `experienceLevel` and `defaultLightLevel`; align **`expert`** with Care tab advanced default | Quick win | S | P2 | [`Settings.tsx`](../../apps/web/src/pages/Settings.tsx), [`PlantCareTab.tsx`](../../apps/web/src/pages/plant-profile/PlantCareTab.tsx) |
| **E3** | Surface **`defaultLightLevel`** in add-plant or browse copy | Quick win | S | P3 | [`BrowsePlants.tsx`](../../apps/web/src/pages/BrowsePlants.tsx) |
| **E4** | **Delete plant** flow (confirm + API) | Quick win | S | P2 | plants API, profile or settings |

---

## Theme F — Social, household, community

**Problem:** APIs support more than the web exposes (post images, journal permission on share).

**Opportunity:** Social features match user expectations without scope creep on core care.

| ID | Recommendation | Type | Effort | Priority | Key paths |
|----|----------------|------|--------|----------|-----------|
| **F1** | **Community post images** — upload + render `imageUrl` | Strategic bet | M | P2 | [`Community.tsx`](../../apps/web/src/pages/Community.tsx) |
| **F2** | Household **`canJournal`** toggle when sharing a plant | Quick win | S | P2 | [`Household.tsx`](../../apps/web/src/pages/Household.tsx) |
| **F3** | Community **pagination**, per-post errors, **a11y** (`aria-pressed` on likes, species combobox) | Quick win | M | P3 | [`Community.tsx`](../../apps/web/src/pages/Community.tsx) |

---

## Theme G — Mobile, push, and release

**Problem:** Push is partial: legacy FCM, mock delivery without keys, limited cron scope. Production UAT sign-off for public URLs is open.

**Opportunity:** Reliable mobile reminders and store-ready packaging.

| ID | Recommendation | Type | Effort | Priority | Key paths |
|----|----------------|------|--------|----------|-----------|
| **G1** | **FCM HTTP v1** migration + **`npm run mobile:push-check`** on real Android | Strategic bet | M | P1 | [`fcm.client.ts`](../../apps/api/src/notifications/fcm.client.ts), [17-mobile-push-setup](../guides/17-mobile-push-setup.md) |
| **G2** | Push **overdue** tasks, **multi-task** body, **deep link to plant** | Strategic bet | M | P2 | [`notifications.cron.ts`](../../apps/api/src/notifications/notifications.cron.ts), [`notifications.service.ts`](../../apps/api/src/notifications/notifications.service.ts) |
| **G3** | Complete **production deploy** checklist (`production:check`, `FRONTEND_URL`, CORS) | Quick win | S | P1 | [deployment.md](../operations/deployment.md), [uat-checklist](uat-checklist.md) §F |
| **G4** | **Capacitor store readiness** — `VITE_API_BASE_URL`, icons, Play closed testing | Strategic bet | L | P2 | [google-play-closed-testing](google-play-closed-testing.md) |

**Note:** `notifySms` on user is stored but not sent — either implement or remove from settings to avoid false expectations.

---

## Theme H — Performance, API shape, and quality

**Problem:** Dashboard endpoint loads broad plant/task payloads; accessibility and E2E gaps remain on newer care UI.

**Opportunity:** Faster loads, inclusive UI, regression safety.

| ID | Recommendation | Type | Effort | Priority | Key paths |
|----|----------------|------|--------|----------|-----------|
| **H1** | **Slim `GET /dashboard`** — targeted aggregates; cross-plant journal/diagnosis snippets ([checklist Phase 7](improvement-checklist.md)) | Strategic bet | M | P2 | [`dashboard.service.ts`](../../apps/api/src/dashboard/dashboard.service.ts) |
| **H2** | **Accessibility pass** — meaningful `alt`, `aria-pressed`, `role="alert"` / `aria-live` on form errors | Strategic bet | M | P2 | web pages/components |
| **H3** | **E2E** for Care tab beginner/advanced, season section with weather, snooze flow | Quick win | S | P2 | [`tests/e2e/uat.spec.ts`](../../tests/e2e/uat.spec.ts) |
| **H4** | **Doc drift fixes** — snooze shipped, diagnosis follow-up API shipped, reconcile Phase 4 | Quick win | S | P2 | [uat-checklist](uat-checklist.md), [api/diagnosis.md](../api/diagnosis.md) |

---

## Theme I — Plant Buddy (secondary lane)

Buddy (XP, shop, quests, social garden) is a large parallel product surface. **Do not let buddy work crowd out core care recommendations** unless engagement is the explicit goal.

For buddy-specific phases and APIs, use [docs/guides/buddy/](../guides/buddy/INDEX.md). This recommendations doc only notes:

- Buddy onboarding is a **separate gate** from main garden onboarding.
- Push routes for buddy vs tasks are documented in [push-notifications](../operations/push-notifications.md).

---

## Prioritized roadmap (suggested horizons)

### Now (2–4 weeks)

Focus: diagnosis recovery, journal photos, mobile trust, doc/E2E hygiene.

1. **C4 + C3** — Richer Dr. Plant context; diagnosis history photos/notes
2. **G1 + G3** — FCM v1 + production deploy sign-off
4. **H3** — E2E for structured task instructions + snooze
5. **A5** — Optional completion notes

**Recently shipped:** A1, A2, B1, B2; **C2** (diagnosis recovery tasks); **D1** (journal photo UX).

### Next (1–2 months)

Focus: scale, social, API shape.

1. **G2** — Richer push content and deep links
2. **H1** — Dashboard aggregates
3. **F1 + F2** — Community images + household journal permission
4. **B3** — Species catalog Phase 3 attributes and filters

### Later (backlog)

1. **C5** — Structured diagnosis intake
2. **D3 + D4** — Timeline API + persisted milestones
3. **G4** — Store release program
4. **H2** — Full accessibility audit

---

## Metrics and validation

Track whether recommendations improve outcomes (baseline before/after each slice):

| Metric | Why it matters |
|--------|----------------|
| Task feedback submission rate (skip + complete) | Adaptive scheduling needs signal |
| Schedule suggestion **accept** vs dismiss | User trust in automation |
| Weather advice **fetch** rate (dashboard) | Season/weather tailoring used |
| Care tab engagement (time on tab, toggle usage) | Structured content value |
| Push opt-in + notification open rate (when G1/G2 ship) | Mobile retention |
| `npm run verify` + `npm run uat:e2e` pass rate | Regression safety |
| Support / UAT confusion reports on snooze, diagnosis | Doc accuracy (H4) |

---

## Appendix A — Full recommendation index

Status: **Done** = shipped; **Partial** = some code exists; **Not started** = gap remains.

| ID | Status | Summary |
|----|--------|---------|
| A1 | Done | Complete-time feedback; `water-accelerate` suggestions after repeated dry/stressed WATER completes |
| A2 | Done | `autoPostponeOutdoorWateringFromWeather` on task/plant loads when cache ≥60% rain next 2 days |
| A3 | Done | Skip reason on profile timeline |
| A4 | Done | Unified skip opens feedback panel |
| A5 | Not started | Task completion notes |
| B1 | Done | All 12 task types seeded with structured sections; UI toggle in task instructions modal |
| B2 | Done | `verify-care-guides.mjs` asserts structured fields per task type |
| B3 | Partial | Browse/filters exist; Phase 3 attributes open |
| C1 | Done | One-shot diagnosis on Health tab |
| C2 | Done | Recovery task suggestions + user confirm on Health tab |
| C3 | Partial | Follow-up note not persisted; images hidden in list |
| C4 | Partial | Chat has context; not full care/skip/weather |
| C5 | Not started | Structured pre-diagnosis intake |
| D1 | Done | Journal photos: preview, photo-only, edit, remove photo, delete confirm |
| D2 | Partial | API measurements; limited UI |
| D3 | Partial | Client-side timeline merge |
| D4 | Partial | Ephemeral dashboard milestones only |
| E1 | Done | Notes + toxicity preview on Add Plant |
| E2 | Done | Settings care preferences |
| E3 | Not started | defaultLightLevel surfaced in UX |
| E4 | Not started | Delete plant UI |
| F1 | Not started | Community post images |
| F2 | Not started | canJournal on household share |
| F3 | Partial | Community shipped; pagination/a11y gaps |
| G1 | Partial | Legacy FCM; mock without key |
| G2 | Partial | Cron today/tomorrow only; single-line body |
| G3 | Not started | Production URL sign-off (UAT §F) |
| G4 | Partial | Capacitor scripts; store TBD |
| H1 | Partial | Dashboard endpoint exists; still heavy payload |
| H2 | Not started | Systematic a11y pass |
| H3 | Not started | E2E for new care UI + snooze |
| H4 | Done | UAT snooze note, diagnosis API doc, Phase 4 reconciliation |

### Already shipped (related work — do not re-implement blindly)

| Capability | Evidence |
|------------|----------|
| Task snooze 1/3/7 days | `PATCH /tasks/:id/snooze`, `TaskRow` |
| Skip with reasons | `TaskFeedback`, skip DTO |
| Schedule suggestions + approval | `scheduler.service.ts`, dashboard UI |
| Structured plant care overview | `plant-care-overview.builder.ts`, Care tab |
| Structured task care guides | `care-guide-templates.ts`, `TaskInstructionsModal`, `StructuredCareSectionCard` |
| Complete-time task feedback | `complete-task-feedback.dto.ts`, `TaskRow` WATER panel |
| Weather auto-postpone outdoor water | `autoPostponeOutdoorWateringFromWeather` in scheduler |
| Weather in care overview | `plants.service.ts` + weather cache |
| Dr. Plant per plant | Health tab, `DrPlantChat` |
| Demo garden seed | `prisma/seed-demo-garden.ts` |

---

## Appendix B — References

| Document | Role |
|----------|------|
| [improvement-checklist.md](improvement-checklist.md) | Implementation queue and acceptance checks |
| [feature-availability.md](../reference/feature-availability.md) | Web vs API matrix |
| [application-overview.md](../application-overview.md) | Stack and domains |
| [uat-checklist.md](uat-checklist.md) | Full UAT matrix |
| [guides/06-care-guides-and-content.md](../guides/06-care-guides-and-content.md) | Care content pipeline |
| [guides/14-product-qa-and-roadmap.md](../guides/14-product-qa-and-roadmap.md) | QA artifacts and maturity matrix |
| [architecture/scheduling.md](../architecture/scheduling.md) | Scheduler behavior |
| [AGENTS.md](../../AGENTS.md) | Agent workflow (commit/sync) |

---

## Document maintenance

When shipping a recommendation:

1. Update **Appendix A** status for that ID.
2. If user-facing, update [feature-availability.md](../reference/feature-availability.md) and relevant tutorial.
3. Check off or annotate the matching item in [improvement-checklist.md](improvement-checklist.md) when the slice is fully done with acceptance criteria.

When researching new gaps, add rows under the appropriate theme rather than duplicating the checklist verbatim.
