# Dashboard API

> **Navigation:** [API INDEX](INDEX.md) · [Guide: Dashboard](../guides/07-web-application.md#dashboard)

**Controller:** `apps/api/src/dashboard/dashboard.controller.ts`  
**Path:** `GET /api/v1/dashboard`  
**Auth:** JWT required

## Purpose

Returns a **single aggregated payload** for the garden home screen: greeting, metrics, today’s tasks preview, attention items, week preview, schedule suggestions, engagement score, and weather hints.

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
| `todayTasks` | Preview rows for task list UI |
| `attention` | Plants/issues needing care (priority) |
| `weekPreview` | 7-day task counts |
| `scheduleSuggestions` | Adaptive schedule proposals |
| `engagement` | Score, streak, milestones context |

Implementation: `dashboard.service.ts` + `dashboard-helpers.ts`.

## Related

- [web/pages/dashboard.md](../web/pages/dashboard.md)
- [api/tasks.md](tasks.md) (schedule suggestions apply)
- [architecture/scheduling.md](../architecture/scheduling.md)
