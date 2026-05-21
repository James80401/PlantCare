# Tutorial: Completing tasks

> **Navigation:** [Tutorials INDEX](INDEX.md) · [User guide: tasks](../user-guide/task-calendar.md) · [User guide: dashboard](../user-guide/garden-dashboard.md)

You can complete or skip care tasks from three places in the app. API: `PATCH /tasks/:id/complete` or `PATCH /tasks/:id/skip`.

## From garden dashboard (`/garden`)

1. **Your schedule** section lists upcoming days (short preview)
2. Use the **circle checkbox** on each task row to mark complete
3. Use **Skip** on the row when available
4. Open **How to do this** for care instructions

## From task calendar (`/garden/tasks`)

1. Tasks grouped by **due date**, then by **care type** (water, prune, …)
2. Toggle **All days** vs **Upcoming** to filter
3. **Circle checkbox** to complete; **Skip** on the row
4. **How to do this** opens the instructions modal

## From plant profile (`/garden/plants/:id`)

1. Pending tasks listed in the profile
2. Tap the green **Done** button on a task (not a checkbox)
3. **Skip is not available** on the profile — use dashboard or task calendar to skip
4. **How to do this** works the same way

## After complete

Scheduler creates the **next** occurrence (interval depends on task type). Mist tasks won’t reschedule if the plant is outdoor/succulent — see [growing environment](../care-guides/growing-environment.md).
