# Guide 08 — UI components & design

> **Navigation:** [Guides INDEX](INDEX.md) · [Web components INDEX](../web/components/INDEX.md)

## Layout & navigation

| Component | Role |
|-----------|------|
| `Layout` | Header, desktop nav, mobile bottom nav, `<Outlet>` |
| `ProtectedRoute` | Auth guard |
| `OnboardingGate` | Blocks garden until onboarding done |
| `Home` | Marketing landing |

**Navigation items (typical):** Garden (dashboard), Tasks, Calendar, Browse, Community, Settings. Household linked from settings or nav depending on build.

Doc: [web/components/layout-and-shell.md](../web/components/layout-and-shell.md).

---

## Task UI

| Component | Role |
|-----------|------|
| `TaskRow` | Single task with complete/skip/snooze |
| `TaskDayGroup` | Group by day on tasks page |
| `TaskInstructionsModal` | Full care guide sections |
| `TaskScheduleExplanationModal` | “Why this date” factors |

Docs: [web/components/tasks-ui.md](../web/components/tasks-ui.md), [task-instructions.md](../web/components/task-instructions.md).

---

## Health & diagnosis

| Component | Role |
|-----------|------|
| `DiagnosisForm` | Photo + notes → diagnose |
| `DiagnosisResult` | Shows label, confidence, actions |
| `DrPlantChat` | Threaded chat UI |
| `TreatmentPlan` | Follow-up suggestions |

Docs: [diagnosis-result.md](../web/components/diagnosis-result.md), [dr-plant-chat.md](../web/components/dr-plant-chat.md).

---

## Weather

| Component | Role |
|-----------|------|
| `WeatherAdvicePanel` | Dashboard/settings advice |
| Rain skip flows | Confirm skipping outdoor water tasks |

Integrated with `WeatherService` API and user location in settings.

---

## Engagement

| Component | Role |
|-----------|------|
| `EngagementProgress` | Streaks, milestones on dashboard |
| Garden score widgets | Link to `/garden/insights/score` |

---

## Photos & uploads

| Component | Role |
|-----------|------|
| `PhotoCaptureZone` | Camera/file picker for plant/journal |
| Upload progress | Uses `plantsApi.upload` |

---

## Shared UI kit

`apps/web/src/components/ui/` — buttons, cards, modals, skeletons. Prefer reusing these for consistent spacing and emerald/lime brand.

---

## Design tokens

- **Brand:** emerald greens, lime accents, `font-display` for headings.
- **Mobile:** bottom nav, `pb-24` on main content for safe area.
- **Dark hero sections:** dashboard header gradient.

---

## Accessibility

- Use semantic headings (`h1` on each page for E2E and screen readers).
- Label form fields (`getByLabel` in Playwright).
- Focus states on interactive cards.

---

## Related

- [07 — Web application](07-web-application.md)
- [10 — End-user guide](10-end-user-product-guide.md)
