# User guide: Landing and authentication

> **Navigation:** [User guide INDEX](INDEX.md) · [Web: auth pages](../web/pages/auth.md) · [Tutorial: first-time user](../tutorials/first-time-user.md)

| Route | Page |
|-------|------|
| `/` | Landing (guest) or redirect to `/garden` when signed in |
| `/login` | Sign in |
| `/register` | Create account |
| `/verify-email/:token` | Email verification (redirects to `/garden` on success) |
| `/resend-verification` | Resend verify email |
| `/forgot-password` | Request reset |
| `/reset-password/:token` | New password |

## Garden access

Protected routes under `/garden/*` require a valid JWT. If SMTP is configured, **register** may require **email verification** before login works; until then you cannot reach the garden.

Login may show a prompt to verify your email if the account is unverified.

## Tokens

JWT stored in `localStorage` (`accessToken`, `refreshToken`). Auto-refresh on 401 via axios interceptor.

See [email and auth setup](../getting-started/email-and-auth-setup.md) for SMTP configuration.
