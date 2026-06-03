# Stripe integration

> **Navigation:** [Integrations INDEX](INDEX.md)

```env
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID_PREMIUM=
PREMIUM_PRICE_LABEL="$4.99/month"
PREMIUM_TRIAL_DAYS=14
```

`BillingService` creates Stripe Checkout sessions, opens the Stripe Customer Portal, and updates `User.planTier` from subscription webhooks.

Production: set the Stripe values above and leave `ALL_USERS_PREMIUM=false`.

Dev: `ALL_USERS_PREMIUM=true` bypasses payment without rewriting stored user tiers.
