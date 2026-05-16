# Models: User and subscription

> **Navigation:** [Models INDEX](INDEX.md)

## User

Auth, `planTier`, notification flags, `latitude`/`longitude`, identify quota, email/password reset tokens.

Relations: `plants`, `subscriptions`, `deviceTokens`, `notificationLogs`

## Subscription

Links to Stripe via `stripeId`; `status` enum.
