# Tutorial: Completing tasks

> **Navigation:** [Tutorials INDEX](INDEX.md) · [User guide: tasks](../user-guide/task-calendar.md)

## From task calendar

1. **/garden/tasks** — tasks grouped by due date
2. Open **How to do this** for instructions
3. Mark **Done** or skip from list (API: `PATCH /tasks/:id/complete` or `skip`)

## From plant profile

Pending tasks listed on profile — same complete action.

## After complete

Scheduler creates the **next** occurrence (interval depends on task type). Mist tasks won’t reschedule if plant is outdoor/succulent — see [growing environment](../care-guides/growing-environment.md).
