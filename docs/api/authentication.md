# API: Authentication

> **Navigation:** [API INDEX](INDEX.md) · `apps/api/src/auth/`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create user |
| POST | `/auth/login` | Access token + HttpOnly refresh cookie |
| POST | `/auth/refresh` | Rotate refresh cookie and issue a new access token |
| POST | `/auth/logout` | Revoke and clear the refresh cookie |
| POST | `/auth/verify-email/:token` | Verify email |
| POST | `/auth/resend-verification` | Resend email |
| POST | `/auth/forgot-password` | Send reset |
| POST | `/auth/reset-password` | Set password |

Production access gate:

- When SMTP/admin approval is enabled, registration sends a verification email.
- After verification, non-admin users remain blocked until an admin approves/enables them.
- Admins manage access at `/admin/registrations`; disabling an account blocks JWT-protected app content.

Credentialed web/native requests use the `drplant_refresh` cookie on auth
routes. During the compatibility release, refresh/logout also accept the former
body token while updated clients roll out. Browser origins are checked against
the configured web and Capacitor CORS origins.

**Service:** `auth.service.ts` - bcrypt, JWT signing, email tokens.
