# User guide: Garden dashboard

> **Navigation:** [User guide INDEX](INDEX.md) · [Web: dashboard](../web/pages/dashboard.md) · [Tutorial: completing tasks](../tutorials/completing-tasks.md)

**Route:** `/garden`

## Header

- Welcome message with your first name and plant count
- **+ Add plant** → `/garden/plants/new`
- Summary badges: due today, upcoming, done this week

## Weather

If you set latitude/longitude in [Settings](settings.md), a banner may show rain-related watering adjustments or a weather message from `GET /users/me/weather`.

## Your schedule

- Preview of tasks for roughly the **next few days** (loaded with `pastDays: 0`, `futureDays: 7`, then filtered to ~3 days)
- Same **TaskDayGroup** / **TaskRow** UI as the full task calendar: checkbox to complete, skip control, **How to do this** for instructions
- **All tasks →** link to `/garden/tasks` for the full calendar (14 days past, 45 days future)

You can complete or skip tasks from the dashboard without opening the task calendar.

## Your plants

- Grid of plant cards with image, name, species, and next pending task
- Tap a card → plant profile (`/garden/plants/:id`)

## Navigation (layout)

Add plant, Tasks, Settings, Subscription (premium badge may show in dev — see [subscription](subscription.md)).
