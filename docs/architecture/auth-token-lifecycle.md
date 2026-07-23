# Auth token lifecycle

> **Navigation:** [Architecture INDEX](INDEX.md) · [Auth & security](auth-and-security.md) · [API authentication](../api/authentication.md)

Deep dive on how access and refresh tokens are issued, rotated, and revoked. The
high-level guard/CORS picture lives in [auth-and-security.md](auth-and-security.md);
this doc is the token state machine.

All logic is in [`AuthService`](../../apps/api/src/auth/auth.service.ts).

---

## Two tokens

| Token | Signed with | TTL var | Stored server-side? |
|-------|-------------|---------|---------------------|
| **Access** | `JWT_SECRET` | `JWT_EXPIRES_IN` (default `7d`) | No — stateless |
| **Refresh** | `JWT_REFRESH_SECRET` | `JWT_REFRESH_EXPIRES_IN` (default `30d`) | **Yes** — hashed row in `RefreshToken` |

The access token is a pure stateless JWT. The refresh token is *also* a JWT, but a
**SHA-256 hash** of it is persisted in the [`RefreshToken`](../database/schema-reference.md)
table so it can be rotated and revoked. The raw token is never stored.

---

## Issuance (`issueTokens`)

On register / login / verify-email / refresh, `issueTokens` mints both tokens,
writes a `RefreshToken` row, and the controller sets the refresh token in the
`drplant_refresh` HttpOnly cookie:

```
RefreshToken {
  tokenHash   sha256(refreshJwt)   // unique
  familyId    uuid                 // shared across a rotation chain
  parentId    previous row id      // null on a fresh login
  expiresAt   now + parsed TTL
  revokedAt   null
  replacedBy  null
}
```

A fresh login starts a **new family** (`familyId`). Every subsequent rotation keeps
the same `familyId` and links `parentId → child`, forming a chain.

> `refreshTokenLifetimeMs` parses `JWT_REFRESH_EXPIRES_IN` (`\d+[smhd]`). An unparseable
> value logs a one-time warning and falls back to 30d, so a typo like `7 days` is
> visible in logs instead of silently diverging the DB expiry from the JWT `exp`.

In production the cookie is `Secure`, `HttpOnly`, `SameSite=None`, and limited
to `/api/v1/auth`, which supports both the web origin and the existing
Capacitor origins. Development uses a non-secure `SameSite=Lax` cookie.

---

## Rotation (`refresh`)

`POST /auth/refresh` reads the cookie, verifies the JWT signature, then looks
up the row by token hash and walks this decision tree:

```
no row found                      → 401 (unrecognized)
row.userId ≠ token.sub            → revoke family, 401
row.expiresAt < now               → 401 (expired)
row.revokedAt set ──┐
                    ├─ within 10s grace AND replacedBy set → ALLOW (concurrent refresh)
                    └─ otherwise                           → revoke family, 401 (reuse)
account REJECTED / PENDING / unverified → 401
otherwise                         → rotate
```

On a successful rotation: a new token is issued in the same family, and the presented
row is marked `revokedAt = now`, `replacedBy = newRowId`.

### Reuse detection
If a token that was already rotated away (`revokedAt` set) is presented again, that's
the classic stolen-refresh-token signal. The **entire family is revoked**, forcing a
fresh login. This bounds the damage of a leaked token.

### The 10-second grace window
Naive reuse detection breaks legitimate clients: a flaky-network retry or two app
instances (web + mobile) restoring a session can fire two `/auth/refresh` calls with
the same token nearly simultaneously. Both pass the `revokedAt == null` check, both
rotate, and the next use of either sibling trips reuse detection — logging out a
real user.

To avoid that, a token revoked **less than `REFRESH_ROTATION_GRACE_MS` (10s) ago**
*and* already pointing at a replacement (`replacedBy` set) is treated as an in-flight
concurrent refresh: a fresh sibling token is issued instead of nuking the family. A
warning is logged so genuine anomalies remain visible. Outside the 10s window, reuse
still revokes the family — security is preserved. See
[ADR-0003](decisions/0003-refresh-rotation-grace-window.md).

---

## Revocation triggers

Refresh tokens are invalidated server-side on:

| Trigger | Scope | Where |
|---------|-------|-------|
| Logout (`POST /auth/logout`) | the presented token | `AuthService.logout` |
| Password reset | all of the user's tokens | `AuthService.resetPassword → revokeAllForUser` |
| Admin reject / disable account | all of the user's tokens | `AdminRegistrationsService.reject/disable` |
| Reuse detected | the whole token family | `AuthService.refresh` |

The frontend `AuthContext.logout` calls `POST /auth/logout` (best-effort, with
`skipAuthRefresh` so a 401 doesn't trigger a refresh loop). Logout clears the
cookie using the same attributes with which it was set.

During the compatibility release, refresh/logout still accept the former
`refreshToken` request field and token-issuing responses still include that
field. Updated clients send credentialed requests and receive the cookie. The
legacy request/response token is removed after the updated web/native clients
are deployed.

> **Access-token caveat:** revoking refresh tokens does not invalidate an
> already-issued *access* token, which stays valid until its own `exp`. Keep
> `JWT_EXPIRES_IN` short enough that the post-revocation window is acceptable; the
> refresh path is what's truly gated.

---

## Configuration

| Variable | Default | Effect |
|----------|---------|--------|
| `JWT_SECRET` | `dev-secret` | Access-token signing key. |
| `JWT_EXPIRES_IN` | `7d` | Access-token TTL (also the post-revocation exposure window). |
| `JWT_REFRESH_SECRET` | `dev-refresh-secret` | Refresh-token signing key. |
| `JWT_REFRESH_EXPIRES_IN` | `30d` | Refresh-token TTL + DB `expiresAt`. |

Set strong secrets in every non-local environment.

---

## Testing

`auth.service.spec.ts` covers the family-revoke-on-replay path and the
grace-window-allows-concurrent-refresh path. `auth.controller.spec.ts` and
`refresh-cookie.spec.ts` cover issuance, rotation, legacy fallback, native/web
origin checks, and cookie attributes. `admin-registrations.service.spec.ts`
asserts reject/disable revoke all tokens.
