# User guide: Landing and authentication

> **Navigation:** [User guide INDEX](INDEX.md) · [Web: auth pages](../web/pages/auth.md)

| Route | Page |
|-------|------|
| `/` | Landing (guest) or redirect to `/garden` |
| `/login` | Sign in |
| `/register` | Create account |
| `/verify-email/:token` | Email verification |
| `/resend-verification` | Resend verify email |
| `/forgot-password` | Request reset |
| `/reset-password/:token` | New password |

JWT stored in `localStorage` (`accessToken`, `refreshToken`). Auto-refresh on 401 via axios interceptor.
