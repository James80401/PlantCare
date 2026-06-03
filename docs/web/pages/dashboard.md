# Page: Dashboard

> **Navigation:** [Pages INDEX](INDEX.md) · `apps/web/src/pages/Dashboard.tsx`

Route: `/garden` (index under Layout).

Garden home — plant cards, upcoming tasks, navigation. See [user guide](../../user-guide/garden-dashboard.md).

## Data contract notes

- The page loads `GET /api/v1/dashboard` through `useDashboard`.
- `careSummary` is the preferred source for the first recommendation card and
  first-screen care counts (headline, body, action, focus plant, and counts).
- Broader fields such as `plants`, `pendingTasks`, `todayTasks`, `attention`,
  `weekPreview`, and `healthStory` still power the detailed sections while the
  dashboard API is slimmed over time.
