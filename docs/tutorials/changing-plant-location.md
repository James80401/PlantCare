# Tutorial: Changing plant location

> **Navigation:** [Tutorials INDEX](INDEX.md) · [API plants PATCH](../api/plants.md#update)

1. Open plant **profile** (`/garden/plants/:id`)
2. Click **Change** next to location
3. Select new location → **Save**

## API

`PATCH /api/v1/plants/:id` with `{ "location": "Outdoor garden" }`

If location changed, API calls `generateTasksForPlant` — **all pending tasks** are rebuilt (water, prune, fertilize, mist per new rules).

Response includes `tasksRescheduled: true`.

## UI feedback

Confirmation message when schedule was updated.
