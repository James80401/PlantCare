# Core UX and accessibility audit worksheet

> Navigation: [Core UX/a11y pass plan](core-ux-a11y-pass-plan.md) | [Accessibility checklist](a11y-checklist.md) | [Mobile viewport QA](mobile-viewport-qa.md)

Use this worksheet for the current private-release polish pass. It is a
repeatable manual script, not a replacement for automated tests.

## Viewports

| Viewport | Size | Use |
|----------|------|-----|
| Mobile | 390 x 844 | Primary phone/PWA layout |
| Desktop | 1440 x 900 | Primary desktop layout |
| Tablet spot check | 768 x 1024 | Optional layout pressure check |

## Test states

| State | Purpose |
|-------|---------|
| Empty account | First-run empty states, onboarding, Add Plant entry |
| One healthy plant | Normal dashboard, profile, care guide, task flow |
| Overdue tasks | Critical care prominence, snooze, skip, complete |
| Diagnosis/recovery | Health tab, Dr. Plant context, recovery tasks |
| Recommendations and Plant Life history | Optional guidance, check-ins, journal/story surfaces |

## Core flow script

For each flow, test mobile first, then desktop. Record findings in the issue log
using the categories from the plan.

| Flow | Routes or surfaces | Required checks |
|------|--------------------|-----------------|
| Global shell | Authenticated layout, header, desktop nav, mobile bottom nav, More menu | Skip link works, active route is exposed, focus rings are visible, More closes with Escape and outside click, final content is not hidden by mobile nav |
| Dashboard | `/garden` | Critical tasks, recommendations, story sections, empty/loading/error states are easy to scan |
| Add plant and discovery | `/garden/plants/new`, `/garden/plants/browse` | Search, identify, external match confirmation, save states, and errors are clear |
| Plant profile overview/care | `/garden/plants/:id/overview`, `/care` | Status, next action, care guide, warnings, and long names remain readable |
| Tasks and recommendations | `/garden/tasks`, dashboard cards, plant profile tasks | Complete, skip, snooze, dismiss, and task conversion patterns are consistent |
| Journal and Plant Life | `/garden/plants/:id/journal` | Check-ins, photos, summaries, edit/delete, empty states, and history controls are coherent |
| Dr. Plant health | `/garden/plants/:id/health` | Context panel, chat, treatment plans, action cards, and recovery history are understandable |
| Secondary surfaces | Community, household, settings, admin | Core actions are labelled, recoverable, and mobile-safe |

## Issue log

| ID | Flow | Category | Viewport | Severity | Finding | Decision |
|----|------|----------|----------|----------|---------|----------|
| UX-001 | Global shell | a11y | Mobile/Desktop | Medium | Shell nav controls had inconsistent visible focus treatment. | Fixed in Checkpoint 1 slice. |
| UX-002 | Global shell | a11y | Mobile/Desktop | Medium | More menu did not close with Escape after keyboard users opened it. | Fixed in Checkpoint 1 slice. |
| UX-003 | Global shell | a11y | Mobile/Desktop | Medium | Skip link targeted `#main-content`, but did not explicitly move focus there after activation. | Fixed: skip link now focuses the main landmark directly. |
| UX-004 | Global shell | a11y | Mobile/Desktop | Low | Secondary routes made the More button visually active, but the button name did not announce that it represented the current section. | Fixed: More announces "current section" and its popup is labelled as a navigation group. |
| UX-005 | Dashboard | mobile | Mobile | Medium | First screen had too many metric cards before the user saw what needed action. | Fixed: mobile now shows compact quick stats and hides the full metric grid behind a details disclosure. |
| UX-006 | Dashboard | confusing | Mobile/Desktop | Medium | Critical care competed with garden summaries and optional guidance lower on the page. | Fixed: Priority care now appears immediately after the hero and renders due/overdue task rows before optional content. |

## Pass criteria

- No blocker-level issue remains in the audited flow.
- Keyboard users can reach and leave every interactive control in the flow.
- Focus indicators are visible on links, buttons, tabs, chips, and icon buttons.
- Mobile bottom chrome does not cover primary actions or final content.
- Error and status messages are announced using alert/status semantics.
- Remaining issues are categorized and linked to a follow-up checkpoint.
