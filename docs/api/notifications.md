# API: Notifications & devices

> **Navigation:** [API INDEX](INDEX.md) · `apps/api/src/notifications/`

| Method | Path |
|--------|------|
| POST | `/devices` | Register push device token |

**Cron:** `notifications.cron.ts` runs hourly so each user is selected at their
own local reminder hour. Due-today reminders use only that local calendar day;
overdue reminders use the same local boundary. SMTP email, FCM push, and
Premium-eligible Twilio SMS record `SENT`, `FAILED`, `SKIPPED`, or
`UNCONFIGURED` per channel. Successful channels are deduplicated while failed
channels remain retryable.
