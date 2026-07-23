# System overview

> **Navigation:** [Architecture INDEX](INDEX.md) · [Application overview](../application-overview.md)

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
| **Species catalog** | 440+ seeded plants |
| **Plants & tasks** | User garden + scheduler |
| **Care guides** | Instruction content |
| **Diagnosis** | Dr. Plant chat (+ one-shot API) |
| **Notifications** | Cron reminders (email/SMS/push hooks) |
| **Billing** | Stripe (optional) |

For stack details, data model, API routes, web screens, and MVP caveats, see the **[complete application overview](../application-overview.md)**.

## External optional services

OpenAI, SMTP, PlantNet, Perenual, OpenWeather, and gated Stripe billing — see
[integrations INDEX](../integrations/INDEX.md). User uploads remain on the
backed-up local media volume.

Which features have web UI today: [feature availability](../reference/feature-availability.md).
