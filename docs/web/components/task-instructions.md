# Components: Task instructions

> **Navigation:** [Components INDEX](INDEX.md)

| File | Role |
|------|------|
| `TaskInstructionsLink.tsx` | Opens modal |
| `TaskInstructionsModal.tsx` | Fetches `tasksApi.instructions`, renders readable care sections and images |

Markdown-ish body via `formatGuideBody` in `utils/tasks.ts`.

Care section readability helpers live in `utils/careGuideSections.ts`:

- Classify each section as action, why, warning, seasonal, or reference.
- Show a short lead snippet before the full section body.
- Keep profile care cards and task instruction modal sections visually consistent.
