# Agent instructions (Plant Care)

## Workflow

**Always commit and sync** when you finish a task:

1. Stage and commit with a concise message focused on *why*.
2. Push the current branch to `origin`.
3. Merge into `main` and push `main` (unless the user says to stay on a feature branch only).

See also `.cursor/rules/workflow.mdc`.

## Dr. Plant

Each plant has its own Dr. Plant chat on the **Health** tab.

| Entry point | Path / action |
|-------------|----------------|
| Plant card (garden home) | **Ask Dr. Plant** → `/garden/plants/:id/health#dr-plant` |
| Plant profile header | **Ask Dr. Plant** |
| Health tab | `DrPlantChat` section (`#dr-plant`) |

**API:** `plants/:plantId/diagnose/conversations` (JWT). **Env:** `OPENAI_API_KEY` on the API.

**Implementation notes:**

- Chat uploads use `FormData`; the web client must not send a fixed `Content-Type` (boundary is set automatically).
- Helper: `plantDrPlantPath(plantId)` in `apps/web/src/pages/plant-profile/constants.ts`.

**Docs:** [docs/tutorials/using-dr-plant-chat.md](docs/tutorials/using-dr-plant-chat.md)
