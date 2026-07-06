# User guide: Task calendar

> **Navigation:** [User guide INDEX](INDEX.md) - [Web: tasks](../web/pages/tasks.md) - [Tutorial: completing tasks](../tutorials/completing-tasks.md)

**Route:** `/garden/tasks`

## Date range

Loads tasks from **14 days in the past** through **45 days in the future**
(`useTasksInRange` with `pastDays: 14`, `futureDays: 45`).

## Filters

- **All days** - full loaded range
- **Upcoming** - today and future only

## Layout

- Header summary: due today, completed, remaining
- Tasks grouped by **day** (`TaskDayGroup`)
- Within each day, tasks sorted by **care type** (water, fertilize, prune, and more)
- Each pending row: complete check button, care steps, why-this-date explanation,
  optional result, skip-if-not-needed, and snooze when available

## Task actions

- **Complete** when the care task was done.
- **Add optional result** only when extra context is useful.
- **Skip if not needed** when the plant does not need that care today.
- **Snooze** to move the reminder without completing care or changing the long-term routine.

## vs. dashboard schedule

The [garden dashboard](garden-dashboard.md) shows a **short preview** of the
most immediate care. Use **All tasks** on the dashboard or this page for the
full calendar.

Hook: `useTasksInRange` -> `GET /tasks?from=&to=`
