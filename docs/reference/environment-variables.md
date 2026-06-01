# Environment variables (complete)

> **Navigation:** [Reference INDEX](INDEX.md) · Template: `.env.example` · Related: [Auth token lifecycle](../architecture/auth-token-lifecycle.md) · [AI image pipeline](../architecture/ai-pipeline.md) · [AI cost & usage](../operations/ai-cost-and-usage.md)

## Core & auth

| Variable | Purpose | Default |
|----------|---------|---------|
| `DATABASE_URL` | SQLite file or PostgreSQL URL | — |
| `JWT_SECRET` | Access token signing | `dev-secret` |
| `JWT_EXPIRES_IN` | Access token TTL (also the post-revocation exposure window) | `7d` |
| `JWT_REFRESH_SECRET` | Refresh token signing | `dev-refresh-secret` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh TTL + DB `RefreshToken.expiresAt`; format `\d+[smhd]`, unparseable ⇒ warns + 30d | `30d` |
| `PORT` | API port | `3001` |
| `FRONTEND_URL` | Links in emails | — |
| `CORS_ORIGIN` | Allowed browser origin | — |

## Email

| Variable | Purpose |
|----------|---------|
| `SMTP_HOST` | Mail server |
| `SMTP_PORT` | Mail port (587) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password (Gmail app password locally; Twilio SendGrid `SG.…` API key in production) |
| `EMAIL_FROM` | From header |

## AI & integrations

| Variable | Purpose | Default |
|----------|---------|---------|
| `PERENUAL_API_KEY` | Species API | — |
| `PLANTNET_API_KEY` | Plant ID API (unset ⇒ demo stub) | — |
| `PLANTNET_MIN_CONFIDENCE` | Floor below which an identification is rejected (0–1) | `0.10` |
| `HF_API_TOKEN` | Hugging Face disease classifier hint | — |
| `OPENAI_API_KEY` | OpenAI — enables moderation, diagnosis, chat (unset ⇒ moderation fails open) | — |
| `OPENAI_MODEL` | Generation model for diagnosis/chat | `gpt-4.1-mini` |
| `OPENAI_MODERATION_MODEL` | Vision model for image moderation verdicts | `gpt-4o-mini` |
| `OPENAI_BASE_URL` | API base URL (override for proxies/gateways) | `https://api.openai.com/v1` |
| `AI_RATE_LIMIT_WINDOW_MINUTES` | Sliding window for per-user AI call count | `60` |
| `AI_RATE_LIMIT_MAX_CALLS` | Allowed AI calls per window before pausing | `30` |
| `AI_RATE_LIMIT_PAUSE_HOURS` | Pause duration once the limit trips | `12` |
| `OPENWEATHER_API_KEY` | Weather | — |

## Billing, SMS, storage & misc

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Stripe |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature |
| `STRIPE_PRICE_ID_PREMIUM` | Price ID |
| `PREMIUM_PRICE_LABEL` | Premium price display text |
| `PREMIUM_TRIAL_DAYS` | Stripe Checkout trial length |
| `SENDGRID_API_KEY` | Legacy name — use `SMTP_PASS` with Twilio SendGrid API key |
| `SENDGRID_FROM_EMAIL` | Legacy — use `EMAIL_FROM` |
| `TWILIO_ACCOUNT_SID` | SMS |
| `TWILIO_AUTH_TOKEN` | SMS |
| `TWILIO_FROM_NUMBER` | SMS from |
| `FIREBASE_PROJECT_ID` | Push (planned) |
| `AWS_ACCESS_KEY_ID` | S3 |
| `AWS_SECRET_ACCESS_KEY` | S3 |
| `AWS_REGION` | S3 region |
| `S3_BUCKET` | Bucket name |
| `S3_PUBLIC_URL` | Public URL base |
| `UPLOAD_DIR` | Local uploads path |
| `ALL_USERS_PREMIUM` | Dev: skip Stripe limits |
