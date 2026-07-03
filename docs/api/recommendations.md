# Recommendations API

> **Navigation:** [API INDEX](INDEX.md) - [Dashboard API](dashboard.md)

**Controller:** `apps/api/src/recommendations/recommendations.controller.ts`  
**Path:** `/api/v1/recommendations`  
**Auth:** JWT required

## Purpose

Recommendations are durable, non-critical guidance. They are separate from
care tasks: watering and similar urgent care remains a task, while Plant
Check-In, move/protect, harvest, and flush-soil guidance can surface as
recommendations.

Recommendations refresh daily until the user marks them **Done** or
**Dismissed**. Snooze is intentionally simple: one action hides the item until
tomorrow.

## Routes

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/recommendations` | Refresh and list open dashboard recommendations |
| `GET` | `/recommendations?plantId=:id` | Refresh and list open recommendations for one plant |
| `PATCH` | `/recommendations/:id/done` | Mark a recommendation done |
| `PATCH` | `/recommendations/:id/snooze` | Snooze until tomorrow |
| `PATCH` | `/recommendations/:id/dismiss` | Dismiss the recommendation |
| `POST` | `/recommendations/:id/task` | Convert task-backed recommendations into a pending task |

## Current generators

| Source | Behavior |
|--------|----------|
| `PLANT_CHECK_IN` | Adaptive Plant Check-In cadence: first check after 7 days, stable plants every 30 days, concerns sooner. A submitted Plant Life check-in completes the active recommendation. |
| `CARE_TIMING` | Flush-soil timing, generally 60-90 days depending on plant type |
| `CARE_TIMING` | Harvest guidance for edible plants |
| `ENVIRONMENT` | Plant and garden outdoor move/protect guidance during harsher seasonal windows |
| `ENVIRONMENT` | Garden-wide indoor light-balance review by quarter |

## Statuses

| Status | Meaning |
|--------|---------|
| `ACTIVE` | Visible recommendation |
| `SNOOZED` | Hidden until tomorrow, then active again |
| `DONE` | Completed for the current recommendation cycle |
| `DISMISSED` | Explicitly dismissed |

## Notes

- Recommendations can be plant-specific or garden-wide.
- Priorities are `LOW`, `MEDIUM`, and `HIGH`.
- Recommendations may include an `actionPath` for the web UI.
- Only recommendations with `suggestedTaskType` can be converted into tasks.
- The web UI must ask for explicit confirmation before calling task conversion.
- Routine Plant Life prompts should use `PLANT_CHECK_IN` recommendations, not recurring `HEALTH_CHECK` tasks. Diagnosis follow-ups and weather protection checks may still create explicit `HEALTH_CHECK` tasks.
