# API: Billing

> **Navigation:** [API INDEX](INDEX.md) · `apps/api/src/billing/`

| Method | Path |
|--------|------|
| POST | `/billing/checkout` |
| GET | `/billing/status` |
| POST | `/billing/portal` |
| POST | `/billing/webhook` |

Stripe integration for Premium Checkout, status, Customer Portal, and webhooks. Webhooks update `User.planTier` and `Subscription` rows.

See [integrations/stripe.md](../integrations/stripe.md).
