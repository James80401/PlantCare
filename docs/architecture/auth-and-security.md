# Authentication and security

> **Navigation:** [Architecture INDEX](INDEX.md) · [API authentication](../api/authentication.md) · [Token lifecycle (deep dive)](auth-token-lifecycle.md)

- Passwords: bcrypt in `AuthService`
- Access + refresh JWTs; refresh via `POST /auth/refresh`. Refresh tokens are
  **rotated and revocable** — full state machine in [auth-token-lifecycle.md](auth-token-lifecycle.md).
- `@UseGuards(JwtAuthGuard)` on protected controllers
- `PremiumGuard` is intentionally a no-op during beta — see [ADR-0002](decisions/0002-beta-premium-gating.md)
- Rate limiting on auth endpoints (`login`, `register`, `forgot-password`,
  `resend-verification`) via `express-rate-limit` in `main.ts` (`trust proxy` set for
  correct client IPs behind the reverse proxy)
- Email verification tokens on `User` model; admin-approval flow gates registration
- AI endpoints have their own scope + abuse gates — see [AI cost & usage](../operations/ai-cost-and-usage.md)
- CORS: `CORS_ORIGIN` / `FRONTEND_URL`

**Do not** commit `.env` or log secrets.
