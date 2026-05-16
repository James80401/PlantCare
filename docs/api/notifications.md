# API: Notifications & devices

> **Navigation:** [API INDEX](INDEX.md) · `apps/api/src/notifications/`

| Method | Path |
|--------|------|
| POST | `/devices` | Register push device token |

**Cron:** `notifications.cron.ts` — daily 9:00 due-task reminders via `NotificationsService` (email/SMS/push hooks).
