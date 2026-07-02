# Dashboard API

> **Navigation:** [API INDEX](INDEX.md) · [Guide: Dashboard](../guides/07-web-application.md#dashboard)

**Controller:** `apps/api/src/dashboard/dashboard.controller.ts`  
**Path:** `GET /api/v1/dashboard`  
**Auth:** JWT required

## Purpose

Returns a **single aggregated payload** for the garden home screen: greeting, metrics, today's tasks preview, attention items, recommendations, week preview, schedule suggestions, engagement score, and weather hints.

The web `Dashboard.tsx` also loads plants and tasks separately for interactions; this endpoint optimizes first paint and copy.

## Query parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `from` | ISO date | today − 45 days | Task window start |
| `to` | ISO date | today + 14 days | Task window end |

## Response sections (conceptual)

| Field | Description |
|-------|-------------|
| `greeting` | `name`, `dateLabel`, `statusLine` |
| `metrics` | `totalPlants`, `dueToday`, overdue counts |
| `careSummary` | Server-computed primary care recommendation: status, headline, body, action, focus plant, and counts |
| `todayTasks` | Preview rows for task list UI |
| `attention` | Plants/issues needing care (priority) |
| `attentionSummary` | Server-computed headline, body, and counts for the attention section |
| `weekPreview` | 7-day task counts |
| `weekSummary` | Server-computed headline, body, busiest day, and counts for the 7-day preview |
| `scheduleSuggestions` | Adaptive schedule proposals |
| `recommendations` | Durable non-critical guidance with Done, Snooze, Dismiss, and optional task conversion actions |
| `engagement` | Score, streak, milestones context |

`careSummary` is the preferred lightweight field for the dashboard's first
recommended action. The broader `plants`, `pendingTasks`, `todayTasks`, and
`healthStory` fields remain available for existing UI sections while the
dashboard payload is slimmed over time.

`attentionSummary` is the preferred lightweight source for attention section
copy and counts. `attention` remains the detailed card list.

`weekSummary` is the preferred lightweight source for the seven-day section
copy. `weekPreview` remains the day-by-day grid data.

`recommendations` is sourced from the recommendations module and should stay
separate from `todayTasks`: watering and other critical care stays task-based,
while Plant Check-In, move/protect, harvest, and flush-soil guidance can live as
recommendations.

Implementation: `dashboard.service.ts` + `dashboard-helpers.ts`.

## Related

- [web/pages/dashboard.md](../web/pages/dashboard.md)
- [api/tasks.md](tasks.md) (schedule suggestions apply)
- [api/recommendations.md](recommendations.md)
- [architecture/scheduling.md](../architecture/scheduling.md)
