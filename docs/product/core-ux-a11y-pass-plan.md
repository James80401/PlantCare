# Core UX and accessibility pass plan

> **Status:** active planning document, created 2026-07-03  
> **Navigation:** [Roadmap](roadmap.md) | [Current feature implementation plan](current-feature-implementation-plan.md) | [Audit worksheet](core-ux-a11y-audit.md) | [Accessibility checklist](a11y-checklist.md) | [UAT checklist](uat-checklist.md)

This plan turns the next product priority into a practical implementation queue:
run a manual UX and accessibility pass across the core Dr. Plant flows, then
fix the highest-impact issues in small, shippable slices.

The goal is not to redesign the app from scratch. The goal is to make the
existing product feel calmer, clearer, more consistent, easier on mobile, and
safer to ship privately to testers.

## Scope

### In scope

- Authenticated web app UX.
- Mobile web/PWA behavior.
- Dashboard command-center flow.
- Add plant and species discovery flow.
- Plant profile tabs: Overview, Care, Tasks, Journal, Health.
- Dr. Plant chat and action cards.
- Plant Life check-ins and progress history.
- Recommendations and non-critical guidance.
- Task completion, skip, snooze, and instruction flows.
- Community, household, settings, and admin surfaces where they affect release
  confidence.
- Accessibility mechanics: keyboard, focus, labels, live regions, contrast,
  zoom, form errors, dialogs, and mobile tap targets.
- Empty/loading/error states.
- Copy tone and user confidence.

### Out of scope for this pass

- Final Lighthouse/performance optimization.
- Public SEO/indexing lock-in.
- App-store submission.
- Major new backend product features.
- Large visual redesigns that delay quality fixes.

Those are intentionally later. This pass should make the current product feel
finished before the final performance and SEO lock-in.

## Quality bar

Dr. Plant should feel like a practical daily assistant:

- The next useful action is obvious.
- Critical tasks feel distinct from optional recommendations.
- Health guidance explains what it knows and what the user should do next.
- Mobile layouts are comfortable and do not feel squeezed.
- Empty states are useful, not dead ends.
- Errors are recoverable and written in plain language.
- Keyboard and screen-reader users can complete the core flows.
- The app feels warm without pressuring or guilt-tripping the user.

## Working method

Each implementation slice should follow this loop:

1. Audit the flow on desktop and phone width.
2. Record concrete issues in this document or the touched feature doc.
3. Fix only the issues in that slice.
4. Add focused regression coverage where practical.
5. Run the relevant tests/build/docs checks.
6. Deploy and live-signoff when the user-facing behavior changes.

Avoid broad refactors during this pass unless a local abstraction clearly
reduces duplicated UI behavior.

## Checkpoint roadmap

| Checkpoint | Status | Goal | Exit criteria |
|------------|--------|------|---------------|
| 0. Baseline audit setup | [x] | Define viewports, flows, and issue categories. | Audit worksheet exists and every core flow has an owner slice. |
| 1. Global shell and navigation | [~] | Make page framing, nav, focus, and mobile chrome consistent. | First shell fix shipped: nav focus styling and Escape close for More menu. Continue with manual route-by-route audit. |
| 2. Dashboard command center | [x] | Make the home screen calmer and more action-oriented. | Critical care, recommendations, summaries, and empty states are easy to scan. |
| 3. Add plant and discovery | [ ] | Reduce friction from first plant search to saved plant. | Search, identify, external match confirmation, and empty/error states are clear. |
| 4. Plant profile overview and care | [ ] | Make a plant's status, care, and next action obvious. | Overview and Care tabs explain what matters without overwhelming the user. |
| 5. Tasks and recommendations | [ ] | Make critical tasks and optional guidance feel distinct. | Complete, skip, snooze, dismiss, and task conversion paths are consistent. |
| 6. Journal and Plant Life | [ ] | Make progress history understandable and useful. | Check-ins, photos, summaries, edits, deletes, and empty states feel coherent. |
| 7. Dr. Plant health flow | [ ] | Make diagnosis/chat advice trustworthy and actionable. | Context, action cards, recovery plans, and status history have clear next steps. |
| 8. Secondary surfaces | [ ] | Remove release-risk friction from community, household, settings, and admin. | Core actions are labelled, recoverable, and mobile-safe. |
| 9. Accessibility hardening | [ ] | Close manual a11y gaps found during checkpoints 1-8. | Keyboard, screen-reader, contrast, zoom, dialog, and live-region checks pass. |
| 10. Regression and private signoff | [ ] | Lock the pass with tests, docs, and hosted verification. | Tests/build/docs pass, private live signoff passes, and findings are documented. |

## Issue categories

Use these labels while auditing and fixing:

| Label | Meaning |
|-------|---------|
| `blocker` | User cannot complete a primary flow. |
| `confusing` | User can proceed, but the next step or meaning is unclear. |
| `mobile` | Layout, tap target, viewport, or PWA issue. |
| `a11y` | Keyboard, screen reader, contrast, focus, label, zoom, or live region issue. |
| `copy` | Text is unclear, too technical, too long, too alarming, or not actionable. |
| `state` | Missing or weak empty/loading/error/success state. |
| `consistency` | Similar actions use different patterns or wording. |
| `trust` | User needs more context, source, confirmation, or explanation. |
| `test-gap` | High-risk behavior lacks focused coverage. |

## Checkpoint 0 - Baseline audit setup

### Implementation areas

- Create a reusable QA script for the manual pass.
- Use two primary viewports:
  - Mobile: 390 x 844.
  - Desktop: 1440 x 900.
- Optional tablet spot-check: 768 x 1024.
- Capture the current state of:
  - Empty account.
  - Account with one healthy plant.
  - Account with overdue tasks.
  - Account with diagnosis/recovery state.
  - Account with recommendations and Plant Life history.

### Acceptance

- Each flow below can be tested against at least one realistic data state.
- Findings are grouped by issue category and flow.
- No fixes are made before the first small batch is selected.

**Status (2026-07-05):** baseline audit setup shipped. The reusable worksheet is
[core-ux-a11y-audit.md](core-ux-a11y-audit.md); it defines viewports, test
states, core flow ownership, issue categories, and the first global-shell issue
log.

## Checkpoint 1 - Global shell and navigation

### Surfaces

- Authenticated layout.
- Desktop nav.
- Mobile bottom nav.
- Skip link.
- Page headings.
- Toast/status messaging.
- Modal and sheet behavior.

### Implementation areas

- Confirm each authenticated page has one obvious H1 or page-level title.
- Confirm `main` receives focus after skip link navigation.
- Confirm active nav state is visible and programmatically exposed.
- Ensure bottom nav does not cover page actions or final content.
- Standardize page bottom padding for screens with sticky mobile chrome.
- Check icon-only controls for accessible names and visible focus.
- Verify global loading and error states use polite status regions.
- Review toast/success/error copy for consistency and timing.

### Primary paths

- `apps/web/src/components/Layout.tsx`
- `apps/web/src/components/a11y/`
- `apps/web/src/index.css`
- `apps/web/src/App.tsx`

### Acceptance

- Keyboard users can reach every top-level route.
- Mobile bottom nav never hides the last actionable control.
- Focus rings are visible on buttons, links, tabs, chips, and icon controls.
- Status messages are announced without stealing focus.

**Status (2026-07-05):** shell slices shipped. Header links, desktop nav,
mobile bottom nav, More menu links, and logout now share explicit visible focus
treatment. Desktop and mobile More buttons expose popup state and close with
Escape as well as outside click. The skip link now moves focus directly to
`#main-content`, and More announces when it is the current section for routes
inside the secondary navigation. Remaining Checkpoint 1 work is manual
route-by-route visual review before marking the checkpoint fully done.

## Checkpoint 2 - Dashboard command center

### Surfaces

- `/garden`
- Today care.
- Garden story.
- Plant cards.
- Attention sections.
- Week preview.
- Recommendations.
- Empty/error/loading states.

### Implementation areas

- Make the first screen answer: "What needs my attention today?"
- Separate critical tasks from recommendations visually and verbally.
- Reduce duplicate counts if they compete with the main action.
- Confirm garden summary failures do not collapse the whole dashboard.
- Improve empty states for:
  - No plants.
  - No tasks due.
  - All caught up.
  - No recommendations.
  - Garden summary failed.
- Confirm recommendation card actions are easy to scan on mobile.
- Ensure weather/season hints feel supportive, not noisy.
- Check plant card CTAs for consistency:
  - View plant.
  - Ask Dr. Plant.
  - Complete care.
- Review long plant names and long task labels for wrapping.

### Primary paths

- `apps/web/src/pages/Dashboard.tsx`
- `apps/web/src/pages/Dashboard.test.tsx`
- `apps/web/src/components/recommendations/RecommendationPanel.tsx`
- `apps/api/src/dashboard/`
- `docs/web/pages/dashboard.md`

### Acceptance

- A new user understands how to add the first plant.
- An active user sees critical care before optional guidance.
- A user with no urgent care still gets a useful next action.
- Dashboard is readable at 390 px width with no horizontal scroll.
- Component tests cover changed empty/error/action states.

**Status (2026-07-05):** Dashboard command-center checkpoint complete.
Mobile now opens with compact quick stats and a details disclosure for the full
metric grid. Critical due/overdue care now appears in a named Priority care
section immediately after the hero and before optional guidance. The same
section shows an all-caught-up state when an active garden has no urgent care.
The closeout polish pass moved weather, Buddy, and seasonal context below the
primary garden/recommendation work, tightened recommendation action density on
mobile, and made plant cards, section headers, suggestion cards, attention
items, and recommendation cards safer for long names and long labels. A hosted
visual pass with a temporary approved UAT account covered desktop 1440 x 900 and
mobile 390 x 844 with long garden and plant names. The pass found mobile
horizontal overflow in the dashboard garden grid; `GardenCard` and the dashboard
grid were tightened, redeployed, and rechecked. Final hosted measurements showed
no horizontal overflow on desktop or mobile, and optional garden context remained
below the primary care, garden, recommendation, and next-action sections.

## Checkpoint 3 - Add plant and discovery

### Surfaces

- Add plant wizard.
- Species search.
- Browse/recommended species.
- Photo identify.
- Hybrid external-match confirmation.
- Plant details form.

### Implementation areas

- Review the first-time add-plant path for excess choices.
- Make "search by name" and "identify by photo" clearly distinct.
- Improve external/provisional match copy:
  - What was matched.
  - Confidence.
  - What confirmation does.
  - Whether care is approximate until reviewed.
- Confirm confirmation cannot be mistaken for final expert validation.
- Improve no-results and low-confidence states.
- Make required fields, optional notes, and defaults obvious.
- Confirm species recommendation reasons are visible without crowding cards.
- Check image placeholders and missing-photo behavior.

### Primary paths

- `apps/web/src/pages/AddPlant.tsx`
- `apps/web/src/pages/BrowsePlants.tsx`
- `apps/api/src/plants/`
- `apps/api/src/species/`
- `docs/web/pages/add-plant.md`
- `docs/web/pages/browse-plants.md`

### Acceptance

- A beginner can add a common plant without needing to understand taxonomy.
- Provisional external matches feel useful but honest.
- Photo-ID failure states offer a clear alternate path.
- Mobile form controls are comfortable and labelled.

## Checkpoint 4 - Plant profile overview and care

### Surfaces

- Plant hero/header.
- Overview tab.
- Care tab.
- Species facts.
- Location/environment editor.
- Care guide cards.
- Troubleshooting card.

### Implementation areas

- Make the plant's current state visible near the top:
  - Next task.
  - Recent care.
  - Health status.
  - Important warning or recommendation.
- Check tab labels and active state clarity.
- Reduce repeated care facts between overview and care tab.
- Improve scan order for care guide cards.
- Make beginner guidance the default reading path.
- Keep advanced/detail content expandable where it is dense.
- Ensure toxicity, edible, pesticide, and safety copy is cautious and visible.
- Check weather/environment copy for plain-language wording.
- Confirm "Ask Dr. Plant" handoffs carry enough context.

### Primary paths

- `apps/web/src/pages/PlantProfile.tsx`
- `apps/web/src/pages/plant-profile/`
- `apps/web/src/components/care/`
- `apps/api/src/plants/`
- `docs/web/pages/plant-profile.md`

### Acceptance

- User can tell whether the plant is okay, needs care, or needs health attention.
- Care cards are scannable on mobile.
- Important warnings are not color-only.
- CTA language is consistent with dashboard and Dr. Plant.

## Checkpoint 5 - Tasks and recommendations

### Surfaces

- Task rows.
- Task instruction modal.
- Complete flow.
- Skip flow.
- Snooze flow.
- Recommendation Done/Snooze/Dismiss.
- Recommendation-to-task confirmation.

### Implementation areas

- Confirm task rows show:
  - Plant.
  - Task type.
  - Due state.
  - Why it matters or where to get instructions.
- Keep one-tap completion fast.
- Ensure optional observations do not slow down simple completion.
- Review skip/snooze language for care confidence.
- Make "task" vs "recommendation" unmistakable:
  - Task = time-sensitive care.
  - Recommendation = useful, non-critical guidance.
- Confirm recommendation dismissal copy does not sound permanent unless it is.
- Review task-conversion confirmation before any recommendation creates a task.
- Confirm all panels expose expanded/collapsed state to assistive tech.

### Primary paths

- `apps/web/src/components/tasks/TaskRow.tsx`
- `apps/web/src/components/TaskInstructionsModal.tsx`
- `apps/web/src/components/recommendations/RecommendationPanel.tsx`
- `apps/api/src/tasks/`
- `apps/api/src/recommendations/`

### Acceptance

- Completing, skipping, and snoozing are understandable from dashboard, calendar,
  and plant profile.
- Optional feedback remains optional.
- Recommendation actions are reversible or clearly explained.
- Tests cover any changed action labels, success states, or confirmation states.

## Checkpoint 6 - Journal and Plant Life

### Surfaces

- Journal tab.
- Plant Life check-in form.
- Progress summary.
- Progress entry edit/delete.
- Timeline.
- Photos.
- Derived markers.

### Implementation areas

- Decide final visible naming:
  - Preferred: "Plant Check-In" for the action.
  - Preferred: "Plant Life" for the history area.
- Make the check-in form feel light enough to complete periodically.
- Group answers into practical categories:
  - Overall condition.
  - Leaves.
  - Soil/water.
  - Growth.
  - Pests or concerns.
  - Optional photo.
- Ensure photo is optional and described as helpful, not required.
- Make AI-generated summaries visually distinct from raw user entries.
- Clarify edit/delete effects:
  - Editing refreshes the summary.
  - Deleting removes the entry and updates history.
- Improve empty states for:
  - No journal entries.
  - No check-ins.
  - No photos.
  - Summary unavailable.
- Check timeline filtering and long-history behavior.

### Primary paths

- `apps/web/src/pages/plant-profile/PlantJournalTab.tsx`
- `apps/web/src/pages/plant-profile/PlantTimeline.tsx`
- `apps/api/src/plant-progress/`
- `apps/api/src/journal/`
- `docs/user-guide/plant-profile.md`

### Acceptance

- User understands the difference between a note, a care event, and a Plant Life
  check-in.
- The latest plant story is easy to find.
- Edit/delete actions are safe and clearly confirmed where needed.
- Mobile history controls do not crowd the content.

## Checkpoint 7 - Dr. Plant health flow

### Surfaces

- Health tab.
- Dr. Plant context panel.
- Dr. Plant chat.
- Diagnosis result cards.
- Treatment plan display.
- Recovery suggestions.
- Dr. Plant action cards.

### Implementation areas

- Make "What Dr. Plant sees" useful without exposing prompt internals.
- Check chat upload states, errors, and retry paths.
- Clarify when advice is:
  - Based on this plant's history.
  - Based on a photo/symptoms.
  - General care guidance.
- Make treatment plans easy to follow:
  - Urgency.
  - Ordered steps.
  - Recovery window.
  - When to ask for more help.
- Ensure action cards are explicit drafts until confirmed.
- Review "create task", "save recommendation", and "add journal note" language.
- Make active/resolved diagnosis status obvious in history.
- Confirm diagnosis disclaimers are beginner-safe and not alarmist.

### Primary paths

- `apps/web/src/components/DrPlantChat.tsx`
- `apps/web/src/components/DrPlantContextPanel.tsx`
- `apps/web/src/components/diagnosis/`
- `apps/api/src/diagnosis/`
- `docs/web/components/dr-plant-chat.md`
- `docs/api/diagnosis.md`

### Acceptance

- User can tell what Dr. Plant is using as context.
- Chat actions never silently mutate tasks or recommendations.
- Recovery guidance has a visible follow-through path.
- Health-tab mobile layout remains usable with image uploads and long replies.

## Checkpoint 8 - Secondary surfaces

### Surfaces

- Community feed.
- Household gardens.
- Settings.
- Admin external species review.
- Buddy entry points only where they intersect the main app shell.

### Implementation areas

- Check community post forms, image alt behavior, and empty feed state.
- Confirm household invite/share flows have clear permissions copy.
- Review settings forms for labelled controls and save status.
- Ensure admin review filters and inline edits are not visually cramped.
- Confirm destructive actions use confirmation where appropriate.
- Review permission-denied and not-found states.

### Primary paths

- `apps/web/src/pages/Community.tsx`
- `apps/web/src/pages/Settings.tsx`
- `apps/web/src/pages/Admin*.tsx`
- `apps/api/src/community/`
- `apps/api/src/gardens/`

### Acceptance

- Secondary surfaces do not block private testing.
- Admin review tools are usable enough for current review volume.
- Permission and error states are clear.

## Checkpoint 9 - Accessibility hardening

This checkpoint closes findings from the earlier flow checks and updates
`a11y-checklist.md`.

### Manual checks

- Keyboard-only pass:
  - Dashboard.
  - Add plant.
  - Plant profile.
  - Tasks.
  - Journal/Plant Life.
  - Dr. Plant chat.
  - Community.
  - Settings.
- Screen-reader spot pass:
  - Form errors.
  - Loading/success status.
  - Dialog open/close.
  - Expandable task/recommendation panels.
- 200% zoom:
  - Dashboard.
  - Plant profile.
  - Add plant.
  - Dr. Plant chat.
- Contrast:
  - Warning states.
  - Success states.
  - Disabled states.
  - Priority chips.
  - Recommendation chips.
- Touch:
  - Buttons and icon controls meet comfortable tap targets.
  - Sticky/footer controls do not overlap content.

### Implementation areas

- Add missing labels, descriptions, or live regions.
- Normalize focus styles where local styles suppress them.
- Replace color-only states with text or icon plus text.
- Ensure dialogs restore focus after close.
- Ensure loading states do not shift layout dramatically.
- Add focused `jest-axe` or component coverage where the pattern is reusable.

### Acceptance

- Manual checklist is updated with pass/fail notes.
- No known blocker-level keyboard or screen-reader issue remains.
- Contrast issues are fixed or explicitly deferred with rationale.

## Checkpoint 10 - Regression and private signoff

### Verification

Run the smallest useful set for each slice, then run the full pass before
closing the overall UX/a11y phase:

```bash
npm.cmd --workspace apps/web test
npm.cmd --workspace apps/web run build
npm.cmd run verify:docs
```

If API behavior changes:

```bash
npm.cmd --workspace apps/api test
npm.cmd --workspace apps/api run build
```

Before calling the whole pass complete:

```bash
$env:API_URL='https://api.drplant.app/api/v1'
$env:FRONTEND_URL='https://drplant.app'
npm.cmd run production:signoff -- --live-only --skip-verify
```

### Acceptance

- Changed flows have focused tests where practical.
- Web build passes.
- Docs verify after doc updates.
- Private hosted site is synced after deploy.
- Remaining findings are categorized as:
  - fixed,
  - deferred until performance/SEO phase,
  - deferred until app-store/mobile-device phase,
  - product decision needed.

## Suggested implementation order

Do not run this as one giant sprint. Use this order:

1. Baseline audit setup.
2. Global shell and navigation.
3. Dashboard command center.
4. Tasks and recommendations.
5. Plant profile overview/care.
6. Journal and Plant Life.
7. Dr. Plant health flow.
8. Add plant and discovery.
9. Secondary surfaces.
10. Accessibility hardening.
11. Regression and private signoff.

This starts with the highest-frequency surfaces and shared UI mechanics, then
moves into deeper flows.

## First implementation batch

The first batch should be deliberately small:

1. Add or update a manual QA checklist table for the core flows.
2. Audit global shell/navigation plus dashboard at mobile and desktop widths.
3. Fix the top 3-5 concrete UX/a11y issues found there.
4. Add component tests for any reusable state or action behavior changed.
5. Build, docs-verify, commit, push, deploy, and live-signoff.

After that, continue checkpoint by checkpoint.

## Done definition

This UX/a11y pass is complete when:

- All checkpoints have either shipped fixes or explicit deferrals.
- Dashboard, add plant, plant profile, tasks, Journal/Plant Life, Dr. Plant,
  community, household, settings, and admin have been manually reviewed.
- Keyboard, screen-reader spot checks, 200% zoom, contrast, and mobile tap target
  checks have been run for the core flows.
- Core empty/loading/error states have been reviewed and improved where weak.
- Docs reflect the current UX.
- Tests/build/docs verification pass.
- The private hosted site is synced and live-signoff passes.
