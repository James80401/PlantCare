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

**Service:** `auth.service.ts` — bcrypt, JWT signing, email tokens.
