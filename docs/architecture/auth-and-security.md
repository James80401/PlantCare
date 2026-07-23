# Authentication and security

> **Navigation:** [Architecture INDEX](INDEX.md) ·
> [API authentication](../api/authentication.md) ·
> [Token lifecycle (deep dive)](auth-token-lifecycle.md)

- Passwords are hashed with bcrypt in `AuthService`.
- Access and refresh JWTs rotate through `POST /auth/refresh`. Refresh tokens
  are rotated, revocable, and set in a path-constrained HttpOnly cookie; see
  [auth-token-lifecycle.md](auth-token-lifecycle.md).
- Protected controllers use `@UseGuards(JwtAuthGuard)`.
- `PremiumGuard` is intentionally a no-op during beta; see
  [ADR-0002](decisions/0002-beta-premium-gating.md).
- Authentication endpoints are rate-limited in `main.ts`, with `trust proxy`
  configured so limits use the correct client address behind the reverse
  proxy.
- Email verification and the admin-approval state gate registration.
- AI endpoints have their own scope and abuse gates; see
  [AI cost and usage](../operations/ai-cost-and-usage.md).
- Credentialed CORS reads `CORS_ORIGINS`, `CORS_ORIGIN`, and `FRONTEND_URL`,
  plus the existing Capacitor origins. Cookie-auth endpoints also validate the
  request `Origin`.

**Do not** commit `.env` files or log secrets.
