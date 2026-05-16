# Authentication and security

> **Navigation:** [Architecture INDEX](INDEX.md) · [API authentication](../api/authentication.md)

- Passwords: bcrypt in `AuthService`
- Access + refresh JWTs; refresh via `POST /auth/refresh`
- `@UseGuards(JwtAuthGuard)` on protected controllers
- `PremiumGuard` exists but often bypassed in dev
- Email verification tokens on `User` model
- CORS: `CORS_ORIGIN` / `FRONTEND_URL`

**Do not** commit `.env` or log secrets.
