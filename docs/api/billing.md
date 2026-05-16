# API: Billing

> **Navigation:** [API INDEX](INDEX.md) · `apps/api/src/billing/`

| Method | Path |
|--------|------|
| POST | `/billing/checkout` |
| POST | `/billing/webhook` |

Stripe integration; demo mode without keys. Updates `User.planTier` and `Subscription` rows.

See [integrations/stripe.md](../integrations/stripe.md).
