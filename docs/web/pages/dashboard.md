# Page: Dashboard

> **Navigation:** [Pages INDEX](INDEX.md) · `apps/web/src/pages/Dashboard.tsx`

Route: `/garden` (index under Layout).

Garden home — plant cards, upcoming tasks, navigation. See [user guide](../../user-guide/garden-dashboard.md).

## Data contract notes

- The page loads `GET /api/v1/dashboard` through `useDashboard`.
- `careSummary` is the preferred source for the first recommendation card and
  first-screen care counts (headline, body, action, focus plant, and counts).
- The first actionable dashboard section is **Priority care**. It renders
  interactive task rows from `todayTasks` before optional guidance, or an
  all-caught-up state when there is no urgent care.
- `attentionSummary` is the preferred source for the Needs attention section
  headline, body, and counts.
- `weekSummary` is the preferred source for the Next seven days section
  headline, body, busiest day, and counts.
- Broader fields such as `plants`, `pendingTasks`, `todayTasks`, `attention`,
  `weekPreview`, and `healthStory` still power the detailed sections while the
  dashboard API is slimmed over time.
- Dashboard recommendations render through `RecommendationPanel`, which labels
  each card by source (Dr. Plant, Plant Life, Care timing, Environment, Seasonal)
  and priority, uses "Remind tomorrow" for snooze, and shows a calm "All quiet
  for now" state when there is no non-critical guidance. Task-backed
  recommendations require an inline confirmation before a care task is created.
- Mobile keeps the hero compact with quick care stats and a details disclosure;
  desktop keeps the full metric grid visible.
