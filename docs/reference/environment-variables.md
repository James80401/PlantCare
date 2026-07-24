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
| `AUTH_RATE_LIMIT_MAX` | Login/registration attempts per IP per 15 minutes | `10` |
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
| `OPENAI_TIMEOUT_MS` | Bounded timeout used by existing OpenAI integrations | `60000` |
| `OPENAI_MAX_RETRIES` | Transient retries for existing OpenAI integrations (maximum 3) | `2` |
| `AI_RATE_LIMIT_WINDOW_MINUTES` | Sliding window for per-user AI call count | `60` |
| `AI_RATE_LIMIT_MAX_CALLS` | Allowed AI calls per window before pausing | `30` |
| `AI_RATE_LIMIT_PAUSE_HOURS` | Pause duration once the limit trips | `12` |
| `OPENWEATHER_API_KEY` | Weather | — |

## Observability

See [operations/observability.md](../operations/observability.md). All optional.

| Variable | Purpose | Default |
|----------|---------|---------|
| `SENTRY_DSN` | Enables Sentry error reporting (unset ⇒ no-op) | — |
| `SENTRY_ENVIRONMENT` | Environment tag in Sentry | `NODE_ENV` |
| `SENTRY_TRACES_SAMPLE_RATE` | Performance-trace sampling (0 = errors only) | `0` |

## Billing, SMS, storage & misc

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Stripe |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature |
| `STRIPE_PRICE_ID_PREMIUM` | Price ID |
| `PREMIUM_PRICE_LABEL` | Premium price display text |
| `PREMIUM_TRIAL_DAYS` | Stripe Checkout trial length |
| `TWILIO_ACCOUNT_SID` | SMS |
| `TWILIO_AUTH_TOKEN` | SMS |
| `TWILIO_FROM_NUMBER` | SMS from |
| `FIREBASE_PROJECT_ID` | FCM HTTP v1 project for push delivery |
| `UPLOAD_DIR` | Managed local uploads path (include it in backups) |
| `ALL_USERS_PREMIUM` | Dev: skip Stripe limits |
