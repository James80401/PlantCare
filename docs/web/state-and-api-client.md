# State and API client

> **Navigation:** [Web INDEX](INDEX.md)

## AuthContext

`apps/web/src/context/AuthContext.tsx` — login, register, logout, `refreshUser`, exposes `user`.

Tokens in `localStorage`: `accessToken`, `refreshToken`.

## api.ts

`apps/web/src/services/api.ts` — axios instance with `baseURL` from `VITE_API_BASE_URL`, defaulting to `/api/v1`.

Use the default for local web development with the Vite proxy. Set `VITE_API_BASE_URL` for native/mobile shells so the bundled app can reach a hosted API.

| Export | Endpoints |
|--------|-----------|
| `authApi` | `/auth/*` |
| `plantsApi` | `/plants/*` |
| `tasksApi` | `/tasks/*` |
| `speciesApi` | `/species/search` |
| `journalApi` | journal |
| `diagnosisApi` | one-shot diagnose |
| `diagnosisChatApi` | conversations |

401 interceptor refreshes token once.
