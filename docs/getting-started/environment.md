# Environment configuration

> **Navigation:** [Getting started INDEX](INDEX.md) · [Full variable table](../reference/environment-variables.md)

Copy `.env.example` to `.env` at repo root.

## Required for basic local dev

| Variable | Typical value |
|----------|----------------|
| `DATABASE_URL` | `file:./prisma/dev.db` |
| `JWT_SECRET` | any dev string |
| `JWT_REFRESH_SECRET` | any dev string |
| `PORT` | `3001` |
| `FRONTEND_URL` | `http://localhost:5173` |
| `CORS_ORIGIN` | `http://localhost:5173` |

## Optional but common

| Variable | Enables |
|----------|---------|
| `OPENAI_API_KEY` | Dr. Plant diagnosis + chat |
| `OPENAI_MODEL` | Model override (e.g. `gpt-4o-mini`) |
| `SMTP_*` + `EMAIL_FROM` | Email verification & password reset |
| `ALL_USERS_PREMIUM` | `true` — all features without Stripe |

## See also

- [Email setup](email-and-auth-setup.md)
- [Integrations INDEX](../integrations/INDEX.md)
