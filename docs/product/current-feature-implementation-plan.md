# Current feature improvement implementation plan

> **Status:** active implementation plan, created 2026-06-03  
> **Navigation:** [Roadmap](roadmap.md) · [Product INDEX](INDEX.md) · [UAT checklist](uat-checklist.md)

This plan turns the consolidated roadmap into concrete engineering slices. The
intent is to keep improving existing shipped features instead of opening a broad
new-feature program.

## Product direction

Plant Care already has the major product surfaces live: dashboard, care tasks,
plant profile, Dr. Plant, journal, species browsing, community, mobile/release
tooling, and Plant Buddy. The current work should make those surfaces faster,
clearer, more trustworthy, and better verified.

## Execution principles

1. Prefer improvements to existing flows over new standalone areas.
2. Keep each slice independently shippable and testable.
3. Preserve production URLs: web `https://drplant.app`, API `https://api.drplant.app/api/v1`.
4. Update [roadmap.md](roadmap.md) first if priority changes.
5. Treat old unchecked checklist rows as prompts, not truth, until reconciled.

## Priority order

| Priority | Track | Why now |
|----------|-------|---------|
| 1 | Dashboard clarity and payload slimming | Home screen is the daily command center; H1 is the clearest partial item. |
| 2 | Care task loop polish | Users need confidence in due dates, feedback, skips, notes, and explanations. |
| 3 | Dr. Plant and recovery polish | Health help is high-value and benefits from clearer context and follow-through. |
| 4 | Journal and progress storytelling | Existing journal/growth data can better show plant progress over time. |
| 5 | Species/catalog depth | Existing browse/recommendation surfaces improve as content coverage grows. |
| 6 | Quality, accessibility, and mobile release checks | Protect existing features as the app moves through public URL and closed testing. |
| 7 | Plant Buddy quality | Buddy is feature-complete; focus on tests, polish, and analytics only when it is the active lane. |

## Track 1 - Dashboard clarity and API slimming

**Goal:** Make the dashboard faster and more story-like without requiring the
client to pull broad plant/task payloads.

### Slice 1.1 - Baseline dashboard contract

- Document the current `GET /dashboard` payload shape and fields actually used by web.
- Add focused API tests around current dashboard response invariants.
- Add a lightweight fixture or builder for dashboard test data.

**Primary paths**

- `apps/api/src/dashboard/`
- `apps/web/src/pages/Dashboard*`
- `docs/api/dashboard.md`
- `docs/web/pages/dashboard.md`

**Acceptance**

- API tests cover empty garden, active garden, overdue task, shared plant, and recent diagnosis states.
- Web still renders the existing dashboard without behavior changes.
- Docs describe which dashboard fields are stable.

### Slice 1.2 - Add targeted summaries

- Add cross-plant recent journal summaries.
- Add cross-plant recent diagnosis/health summaries.
- Add concise care momentum data if it can reuse existing task/journal models.
- Keep existing fields during transition to avoid breaking web clients.

**Acceptance**

- API returns summaries without requiring the web to inspect every plant payload.
- Query shape stays bounded by limits and indexes.
- Tests cover summary ordering, limits, and permissions/shared-garden visibility.

### Slice 1.3 - Web uses the slimmer story data

- Update dashboard cards to use targeted summaries.
- De-emphasize duplicate or noisy raw counts.
- Add loading/error/empty states for each dashboard section.

**Acceptance**

- Dashboard has a clearer "what changed since last visit" story.
- Mobile layout remains readable at phone width.
- Existing Playwright dashboard checks pass or are updated to the new UX.

## Track 2 - Care task loop polish

**Goal:** Make task feedback, skips, snoozes, and schedule explanations feel
consistent across dashboard, calendar, and plant profile.

### Slice 2.1 - Task profile parity

- Ensure plant profile task rows expose the same important actions as dashboard/calendar where appropriate.
- Surface skip reason, optional note, snooze status, and schedule explanation on profile task history.
- Avoid divergent task feedback flows between pages.

**Primary paths**

- `apps/web/src/components/tasks/TaskRow.tsx`
- `apps/web/src/pages/plant-profile/PlantTasksTab.tsx`
- `apps/api/src/tasks/`
- `apps/api/src/scheduler/`

**Acceptance**

- Completing, skipping, and snoozing are understandable from all primary task surfaces.
- Existing one-tap flows remain fast.
- Feedback persists and is visible where it helps future care decisions.

**Status (2026-06-03):** `TaskRow` already exposes complete/skip/snooze with
reasons + notes consistently across dashboard, calendar, garden, filtered, and
plant-profile surfaces. This slice's history-surfacing piece shipped: the plant
profile "Recent history" and the plant timeline now pick the **terminal**
feedback by `action` (fixing a bug where a prior SNOOZE row was mislabeled as the
complete/skip reason on tasks finished without explicit feedback) and surface
**reschedule status** ("rescheduled N×"). Backend now returns the full per-task
feedback trail (`plants.service` findOne + timeline). **Remaining:** Slice 2.2
post-care observation prompts.

### Slice 2.2 - Post-care observation prompts

- After completing meaningful tasks, prompt for optional observation notes without blocking completion.
- Save notes through the existing journal/task feedback pathways where possible.
- Feed the resulting context into Dr. Plant and plant timeline surfaces.

**Acceptance**

- Users can complete a task without writing anything.
- If they do write a note, it appears in plant history and can be used as care context.
- API and web tests cover note persistence and display.

**Status (2026-06-03):** the optional post-care prompt already exists in
`TaskRow` (completing a task offers a reason for watering plus a free-text note,
without blocking one-tap completion). This slice's history-surfacing piece
shipped: completed tasks now render their observation (completion reason + note)
in the **plant timeline**, not just on the tasks tab — previously DONE events
showed only a generic "marked complete" line. **Remaining:** optionally feed
recent completion observations into Dr. Plant context (overlaps Track 3 / Slice
3.1) and an explicit "also save as a journal note" affordance if product wants
observations promoted into the journal proper.

## Track 3 - Dr. Plant and recovery polish

**Goal:** Make Dr. Plant advice easier to trust and act on using existing plant,
task, diagnosis, weather, and journal context.

### Slice 3.1 - Context transparency

- Show users which context Dr. Plant is considering: recent care, skips, weather, journal notes, and active issues.
- Add a compact context summary before or near the chat input.
- Keep details expandable to avoid overwhelming the Health tab.

**Primary paths**

- `apps/api/src/diagnosis/`
- `apps/web/src/components/dr-plant-chat.md`
- `apps/web/src/pages/plant-profile/PlantHealthTab*`

**Acceptance**

- Users can see why advice may reference recent events.
- Missing context questions remain easy to answer.
- No API secrets or prompt internals are exposed.

### Slice 3.2 - Recovery follow-through

- Improve the visibility of recovery tasks and follow-up notes created from diagnosis.
- Make status changes obvious in diagnosis history.
- Consider explicit "add to journal" or "create follow-up task" actions only where the existing backend supports them cleanly.

**Acceptance**

- Health tab clearly shows open, improving, and resolved plant issues.
- Follow-up tasks link back to their diagnosis context.
- Regression tests cover recovery status and follow-up task display.

## Track 4 - Journal and progress storytelling

**Goal:** Make the plant profile feel like a living history, using existing
journal photos, care actions, diagnoses, measurements, and milestones.

### Slice 4.1 - Timeline polish

- Ensure photos, notes, care actions, diagnoses, treatments, measurements, and milestones are grouped consistently.
- Add filters or section anchors if the timeline becomes long.
- Improve empty states for plants with no journal history.

**Primary paths**

- `apps/api/src/plants/`
- `apps/api/src/journal/`
- `apps/web/src/pages/plant-profile/PlantJournalTab.tsx`
- `apps/web/src/pages/plant-profile/PlantProfileContext.tsx`

**Acceptance**

- Timeline order is stable and understandable.
- Users can distinguish observations, care events, diagnoses, and progress changes.
- Tests cover representative mixed timelines.

### Slice 4.2 - Photo comparison and growth review

- Add a simple before/after photo compare flow using existing journal photos.
- Highlight measurement changes without making users enter measurements every time.
- Keep photo-only and measurement-only entries working.

**Acceptance**

- Users can compare recent growth photos on a plant profile.
- Measurement deltas are visible but optional.
- Mobile interaction works without horizontal overflow.

## Track 5 - Species and catalog depth

**Goal:** Improve existing browse and recommendation quality through content
coverage and filters, not a new catalog product.

### Slice 5.1 - Category coverage audit

- Re-run or extend species verification to identify thin categories.
- Prioritize houseplants, succulents/cacti, herbs/edibles, vegetables/fruits, outdoor ornamentals, and native/pollinator-friendly metadata.
- Produce a small coverage report before adding data.

**Primary paths**

- `prisma/data/species-catalog.ts`
- `prisma/data/care-guide-templates.ts`
- `scripts/verify-species-catalog.mjs`
- `apps/api/src/species/`

**Acceptance**

- Coverage gaps are measurable.
- Data additions include verification updates.
- Browse filters stay fast and understandable.

### Slice 5.2 - Recommendation quality pass

- Tune recommendations using existing care metadata, light needs, difficulty, toxicity, and outdoor/indoor fit.
- Add user-facing copy explaining why a plant is recommended.

**Acceptance**

- Browse and add-plant recommendations explain fit clearly.
- Tests or verification scripts cover new recommendation inputs.

## Track 6 - Quality, accessibility, and mobile release checks

**Goal:** Make existing features safer to ship through the live public URL and
Android closed testing path.

### Slice 6.1 - Production sign-off record

- Run full production sign-off against:
  - Web: `https://drplant.app`
  - API: `https://api.drplant.app/api/v1`
- Record the sign-off artifact under `docs/operations/signoffs/`.
- Run optional production E2E when credentials and target data are safe.

**Acceptance**

- `production:signoff` passes or documents blockers.
- A dated sign-off artifact exists.
- UAT checklist references the completed run.

### Slice 6.2 - Manual accessibility pass

- Keyboard pass through dashboard, plant profile, tasks, Dr. Plant, journal, and community.
- Screen reader check for form errors and status messages.
- 200% zoom and focus ring pass.
- File follow-up fixes as small focused tasks.

**Acceptance**

- Manual findings are recorded.
- Blocking a11y issues are fixed or explicitly deferred with rationale.

### Slice 6.3 - Android closed testing preflight

- Configure mobile API base URL for production.
- Run `mobile:store-check -- --live`.
- Run push preflight if device credentials are available.
- Prepare signed AAB and Play Console checklist.

**Acceptance**

- Store check passes against production.
- At least one tester can install through the selected Play testing track.

## Track 7 - Plant Buddy quality lane

**Goal:** Keep Buddy stable and polished without crowding out core care work.

### Slice 7.1 - Buddy regression tests

- Add focused tests for API endpoints and event listeners.
- Cover midnight streak behavior and accelerated journey timer behavior.
- Keep shop purchase edge cases covered.

### Slice 7.2 - Buddy polish pass

- Mobile layout pass on iOS and Android.
- Tone review for warm, plant-focused, non-pressuring copy.
- Decide whether server analytics aggregates are needed before adding them.

## Recommended first batch

Start with a batch that improves daily value and lowers risk:

1. **Slice 1.1** - Baseline dashboard contract and tests.
2. **Slice 1.2** - Add targeted dashboard summaries.
3. **Slice 2.1** - Task profile parity for explanations, skip/snooze, and notes.
4. **Slice 6.1** - Full production sign-off artifact for `drplant.app`.

This batch improves the current user home screen, tightens the task loop, and
records confidence in the live deployment before deeper polish.

## Validation checklist for each implementation slice

- [ ] API unit/service tests for backend behavior.
- [ ] Web component or page tests for UI states when practical.
- [ ] Playwright coverage for changed primary flows when user-facing.
- [ ] `npm run build`.
- [ ] `npm run verify` when API/data behavior changes.
- [ ] `npm run verify:docs` when docs are edited.
- [ ] Update [roadmap.md](roadmap.md) status if a roadmap item moves.

## Open decisions

| Decision | Needed before |
|----------|---------------|
| Are harvest/move/flush task types real product needs or stale checklist ideas? | Any task-type schema/API work |
| Should Dr. Plant be allowed to create tasks/journal notes directly, or only suggest user-confirmed actions? | Track 3 action work |
| Which species categories matter most for current users? | Track 5 data additions |
| Is Buddy analytics needed for product decisions, or is client tracking enough? | Buddy analytics work |
