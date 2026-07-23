# Guide 09 — Integrations & external services

> **Navigation:** [Guides INDEX](INDEX.md) · [Integrations INDEX](../integrations/INDEX.md)

## Overview

Dr. Plant delegates specialized work to external APIs. All integrations are **optional** unless noted; the app degrades gracefully when keys are missing.

| Integration | Required? | Feature impact |
|-------------|-----------|----------------|
| (none) | — | Core tasks, SQLite, local uploads |
| SMTP | Optional | Email verify, password reset |
| OpenAI | Optional | LLM diagnosis + Dr. Plant |
| Hugging Face | Optional | Alternate vision models |
| PlantNet | Optional | `POST /plants/identify` |
| Perenual | Optional | Species enrichment (cached) |
| Open-Meteo | Optional | Weather advice (no key) |
| Stripe | Optional | Premium checkout |
| Local media volume | Required for uploads | Production image storage and backups |

Test connectivity: `npm run test:integrations`.

---

## OpenAI

- **Used by:** `diagnosis.service`, `diagnosis-chat.service`
- **Env:** `OPENAI_API_KEY`, model overrides if documented
- **Doc:** [integrations/openai.md](../integrations/openai.md)

---

## SMTP (email)

- **Used by:** `EmailModule` — verification, reset, invites (future)
- **Env:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`
- **Without SMTP:** Register may return `requiresVerification`; forgot-password returns 503 or generic message
- **Doc:** [integrations/smtp.md](../integrations/smtp.md)

---

## Stripe

- **Used by:** `BillingModule` — checkout session, webhook updates `Subscription`
- **Env:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs
- **Doc:** [integrations/stripe.md](../integrations/stripe.md)

---

## PlantNet

- **Used by:** `POST /plants/identify`
- **Env:** `PLANTNET_API_KEY`
- **Limits:** Free tier monthly identify cap in shared package
- **Doc:** [integrations/plantnet.md](../integrations/plantnet.md)

---

## Perenual

- **Used by:** Species enrichment, browse metadata
- **Env:** `PERENUAL_API_KEY`
- **Doc:** [integrations/perenual.md](../integrations/perenual.md)

---

## Weather (Open-Meteo)

- **Used by:** `WeatherModule` — geocoding + forecast + advice cache
- **No API key** for basic Open-Meteo usage
- **Doc:** [integrations/weather.md](../integrations/weather.md)

---

## Storage

- **Dev:** Local `apps/api/uploads/`
- **Prod:** Docker volume mounted at `/app/apps/api/uploads` and included in backups
- **Doc:** [integrations/storage.md](../integrations/storage.md)

---

## Hugging Face

- Optional vision fallback for diagnosis.
- **Doc:** [integrations/huggingface.md](../integrations/huggingface.md)

---

## Environment matrix

See [reference/environment-variables.md](../reference/environment-variables.md) for the full table.

---

## Failure modes

| Symptom | Likely cause |
|---------|----------------|
| Diagnosis always rule-based | No OpenAI key |
| 503 on forgot-password | SMTP not configured |
| Identify 402/429 | PlantNet quota |
| Weather empty | No user location set |
| Checkout fails | Stripe keys or webhook URL |

---

## Related

- [05 — API](05-api-complete-reference.md)
- [13 — Operations](13-operations-deployment-and-quality.md)
