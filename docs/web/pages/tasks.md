# Page: Tasks

> **Navigation:** [Pages INDEX](INDEX.md) · `apps/web/src/pages/Tasks.tsx`

Route: `/garden/tasks`

Uses `useTasksInRange` hook. Renders `TaskDayGroup` / `TaskRow`.

Pending task rows support:

- Complete
- Add an optional completion observation
- Save a completion observation to the plant journal when explicitly checked
- Skip immediately
- Skip with an optional reason/note
- Snooze when the surface provides snooze actions
- Open task-specific care instructions

Completion and skip reasons are stored by the API as `TaskFeedback`. When a
completion note is also saved to journal, the task is completed first and the
journal entry is created only after that succeeds.

**User guide:** [task calendar](../../user-guide/task-calendar.md) · **Tutorial:** [completing tasks](../../tutorials/completing-tasks.md)
