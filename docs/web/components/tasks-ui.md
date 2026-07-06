# Components: Tasks UI

> **Navigation:** [Components INDEX](INDEX.md)

| File | Role |
|------|------|
| `tasks/TaskDayGroup.tsx` | Groups tasks by calendar day |
| `tasks/TaskRow.tsx` | Single task row with complete, optional result, skip, snooze, and instruction actions |
| `TaskInstructionsModal.tsx` | Care-task guide modal opened from task rows |

Task rows should keep the quick care loop clear:

- **Complete** is one tap from the check button.
- **Add optional result** opens task-type-aware feedback, but feedback is not required.
- **Skip if not needed** records why the care task was intentionally not done.
- **Snooze** only moves the reminder; it does not complete care or change the long-term routine by itself.
- **Care steps** open the instruction modal for context, then the user returns to the row to complete, skip, or snooze.

Recommendations are intentionally separate from tasks. Optional guidance uses
`RecommendationPanel`; time-based care belongs in `TaskRow` only after explicit
task creation confirmation.
