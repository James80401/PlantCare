# State and API client

> **Navigation:** [Web INDEX](INDEX.md)

## AuthContext

`apps/web/src/context/AuthContext.tsx` — login, register, logout, `refreshUser`, exposes `user`.

Tokens in `localStorage`: `accessToken`, `refreshToken`.

## api.ts

`apps/web/src/services/api.ts` — axios instance `baseURL: '/api/v1'`

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
