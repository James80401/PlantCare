# System overview

> **Navigation:** [Architecture INDEX](INDEX.md)

```
┌─────────────┐     HTTPS/proxy      ┌─────────────┐
│  React SPA  │ ◄──────────────────► │  NestJS API │
│  (Vite)     │   /api/v1 + static   │  + Prisma   │
└─────────────┘                      └──────┬──────┘
                                            │
                                     ┌──────▼──────┐
                                     │ SQLite/PG   │
                                     │ + uploads   │
                                     └─────────────┘
```

## Core domains

| Domain | Responsibility |
|--------|----------------|
| **Auth** | Register, JWT, email verify |
| **Species catalog** | 240+ seeded plants |
| **Plants & tasks** | User garden + scheduler |
| **Care guides** | Instruction content |
| **Diagnosis** | Dr. Plant + chat |
| **Notifications** | Cron reminders (email/SMS/push hooks) |
| **Billing** | Stripe (optional) |

## External optional services

OpenAI, SMTP, PlantNet, Perenual, OpenWeather, Stripe, S3 — see [integrations INDEX](../integrations/INDEX.md).
