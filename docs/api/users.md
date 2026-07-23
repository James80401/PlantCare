# API: Users

> **Navigation:** [API INDEX](INDEX.md) · `apps/api/src/users/`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/users/me` | Current profile |
| PUT | `/users/me/notification-settings` | Notify flags, quiet hours |
| DELETE | `/users/me` | Delete account; JSON body `{ "password": "current password" }` |
| GET | `/users/me/weather` | Weather (see [weather.md](weather.md)) |

Account deletion verifies the current password, cancels active Stripe
subscriptions when a Stripe customer exists, revokes refresh sessions, deletes
the account-owned records, removes managed media, and clears the refresh cookie.
If billing cannot be reached for an account with a Stripe customer, deletion is
blocked so future charges are not left active.
