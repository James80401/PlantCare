# Page: Tasks

> **Navigation:** [Pages INDEX](INDEX.md) · `apps/web/src/pages/Tasks.tsx`

Route: `/garden/tasks`

Uses `useTasksInRange` hook. Renders `TaskDayGroup` / `TaskRow`.

Pending task rows support:

- Complete
- Skip immediately
- Skip with an optional reason/note
- Open task-specific care instructions

Skip reasons are sent to `tasksApi.skip(id, feedback)` and stored by the API as `TaskFeedback`.

**User guide:** [task calendar](../../user-guide/task-calendar.md) · **Tutorial:** [completing tasks](../../tutorials/completing-tasks.md)
