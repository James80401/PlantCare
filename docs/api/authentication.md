# API: Authentication

> **Navigation:** [API INDEX](INDEX.md) · `apps/api/src/auth/`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create user |
| POST | `/auth/login` | Tokens |
| POST | `/auth/refresh` | New access token |
| POST | `/auth/verify-email/:token` | Verify email |
| POST | `/auth/resend-verification` | Resend email |
| POST | `/auth/forgot-password` | Send reset |
| POST | `/auth/reset-password` | Set password |

Production access gate:

- When SMTP/admin approval is enabled, registration sends a verification email.
- After verification, non-admin users remain blocked until an admin approves/enables them.
- Admins manage access at `/admin/registrations`; disabling an account blocks JWT-protected app content.

**Service:** `auth.service.ts` - bcrypt, JWT signing, email tokens.
