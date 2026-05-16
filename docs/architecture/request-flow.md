# Request flow

> **Navigation:** [Architecture INDEX](INDEX.md)

## Typical authenticated request

1. Browser sends `Authorization: Bearer <accessToken>`
2. `JwtAuthGuard` validates via `JwtStrategy`
3. Controller method runs with `@CurrentUser()`
4. Service uses `PrismaService`
5. JSON response (or static file for uploads/guides)

## Web dev proxy

Vite forwards `/api` → `http://localhost:3001` so the SPA uses relative `/api/v1` paths.

## Static assets (API)

| Path | Source |
|------|--------|
| `/uploads/` | `UPLOAD_DIR` |
| `/care-guides/images/` | `apps/api/src/care-guides/images/` |
| `/care-guides/photos/` | bundled JPEGs |

Configured in `apps/api/src/main.ts`.
