# SMTP (email)

> **Navigation:** [Integrations INDEX](INDEX.md) · Setup: [email-and-auth-setup](../getting-started/email-and-auth-setup.md) · Production: [private-online-setup](../operations/private-online-setup.md) §F1

`EmailService` uses **Nodemailer** with standard `SMTP_*` env vars. No SendGrid/Twilio SDK is required — SMTP relay works with the existing code.

## Local development

Gmail + [App Password](https://myaccount.google.com/apppasswords) on port **587** (see `.env.example`).

Without SMTP: users are **auto-verified** for local convenience.

## Production on DigitalOcean

DO blocks outbound SMTP on ports **25, 587, and 465**. Gmail from the droplet will **timeout** even with a correct App Password.

Use **Twilio SendGrid Email** (Twilio’s transactional email product; formerly standalone SendGrid) on port **2525**:

| Variable | Value |
|----------|--------|
| `SMTP_HOST` | `smtp.sendgrid.net` |
| `SMTP_PORT` | `2525` |
| `SMTP_USER` | `apikey` (literal string, not your email) |
| `SMTP_PASS` | Twilio SendGrid **API key** (`SG.xxx…`) |
| `EMAIL_FROM` | Verified sender, e.g. `"Plant Care <you@gmail.com>"` |

Host stays `smtp.sendgrid.net` — that is Twilio’s SMTP relay hostname.

### Setup checklist (Twilio SendGrid Email)

1. **Account:** [Twilio SendGrid Email](https://www.twilio.com/en-us/sendgrid/email-api) → sign up / log in (SendGrid dashboard: [app.sendgrid.com](https://app.sendgrid.com)).
2. **API key:** Settings → API Keys → Create → **Mail Send** permission → copy `SG.…` once.
3. **Sender:** Settings → Sender Authentication → **Verify a Single Sender** (your Gmail or `@drplant.app` if you add domain auth later).
4. **Droplet test:** `nc -vz smtp.sendgrid.net 2525` → must connect (not timeout).
5. **Deploy:** set vars in `.env.production`, `docker compose … up -d --force-recreate api`, logs should show `SMTP ready`.

Docs: [Twilio SendGrid SMTP](https://www.twilio.com/docs/sendgrid/for-developers/sending-email/getting-started-smtp) · [API keys](https://www.twilio.com/docs/sendgrid/api-reference/api-keys/create-api-keys)

### Pricing (check before launch)

Twilio SendGrid pricing and free tiers change — confirm on [Twilio SendGrid pricing](https://sendgrid.com/pricing/) before relying on a free plan. For a **private beta** (low volume), Essentials is usually enough.

### Future: REST API (optional)

Twilio SendGrid also offers `POST https://api.sendgrid.com/v3/mail/send` with a Bearer API key. Plant Care does **not** use that today; SMTP is sufficient. REST would only be worth adding if SMTP relay becomes unavailable.

## Troubleshooting

| Symptom | Cause |
|---------|--------|
| Connection timeout to `smtp.gmail.com:587` on DO | Port blocked — use Twilio SendGrid on **2525** |
| `535 Authentication failed` | `SMTP_USER` must be `apikey`; password is full `SG.…` key |
| Email not received | Sender not verified in Twilio SendGrid; check spam |
| Forgot-password hangs then timeout | SMTP blocked or wrong host/port |
