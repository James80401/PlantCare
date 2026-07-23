# API: Billing

> **Navigation:** [API INDEX](INDEX.md) · `apps/api/src/billing/`

| Method | Path |
|--------|------|
| POST | `/billing/checkout` |
| GET | `/billing/status` |
| POST | `/billing/portal` |
| POST | `/billing/webhook` |

Stripe integration for Premium Checkout, status, Customer Portal, and webhooks. Webhooks update `User.planTier` and `Subscription` rows.

`ENABLE_PREMIUM_BILLING` is the authoritative API gate and must match the
web build's `VITE_ENABLE_PREMIUM_BILLING`. Checkout, portal, and webhook routes
return 404 while the gate is closed. Status remains readable and reports
`billingEnabled: false`, but never offers subscription management.

When enabled in a later, separately approved release, Stripe and webhook
secrets are mandatory. Missing verification configuration fails closed and an
invalid webhook signature returns a client error rather than a successful
acknowledgement.

See [integrations/stripe.md](../integrations/stripe.md).
