# Production deploy sign-off (G3)

> **Navigation:** [Operations INDEX](INDEX.md) · [deployment.md](deployment.md) · [Guide 15](../guides/15-production-deploy-and-android.md) · [UAT checklist §F](../product/uat-checklist.md)

Automated gate before marking production ready for remote testers or Play Store closed testing.

## Prerequisites

1. DNS + TLS reverse proxy pointing at Docker (`api.*` → port 3001, apex/www → port 8080).
2. `.env.production` on the server (never commit) — copy from [`.env.production.example`](../../.env.production.example).
3. Stack running: `npm run production:up` (first boot: migrations + seed — allow several minutes).

## One-command sign-off

From your laptop (after deploy is live):

```bash
npm run production:check          # static secrets + URL/CORS rules
npm run production:signoff          # live probes + verify + smoke:buddy
npm run production:signoff -- --e2e   # also Playwright against production web
```

Record results:

```bash
npm run production:signoff -- --write docs/operations/signoffs/2026-05-27.md
```

(`docs/operations/signoffs/` is gitignored — keep records locally or in your release notes.)

### Live-only (no local `.env.production`)

```bash
API_URL=https://api.yourdomain.com/api/v1 \
FRONTEND_URL=https://yourdomain.com \
npm run production:signoff -- --live-only
```

## What each step checks

| Step | Meaning |
|------|---------|
| Static env | `JWT_*`, HTTPS URLs, `VITE_API_BASE_URL` ends with `/api/v1`, CORS includes `FRONTEND_URL` |
| API `/health` | Public API responds `{ status: "ok" }` |
| CORS | Browser origin for your web app is allowed |
| Web reachable | `FRONTEND_URL` returns HTML |
| `verify` | Auth, plants, tasks, species, dashboard, devices API smoke |
| `smoke:buddy` | Buddy scheduler dev routes disabled; core buddy paths respond |
| `uat:e2e` (optional) | Playwright mobile + garden flows against production web |

## Required `.env.production` values

```env
JWT_SECRET=<64+ char secret>
JWT_REFRESH_SECRET=<different secret>
FRONTEND_URL=https://yourdomain.com
CORS_ORIGINS=https://yourdomain.com
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
```

Recommended for UAT: `OPENAI_API_KEY`, `SMTP_*`, FCM HTTP v1 (`FIREBASE_PROJECT_ID` + service account) or legacy `FCM_SERVER_KEY`.

## Manual checklist (after automation passes)

- [ ] Email verification link uses `FRONTEND_URL` (register → inbox → sign in).
- [ ] Password reset works if SMTP is configured.
- [ ] Push token registers on a physical device (Android/iOS build with production API URL).
- [ ] Privacy policy URL live (`/privacy` on web app).
- [ ] UAT lead signed [uat-checklist.md §F](../product/uat-checklist.md).

## Staging rehearsal (no public domain yet)

```powershell
npm run staging:check
npm run staging:smoke
```

Staging uses `http://localhost:8080` — not a substitute for HTTPS production CORS, but validates the same `verify` / e2e paths.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| CORS FAIL | Set `CORS_ORIGINS` exactly to `FRONTEND_URL` (no trailing slash mismatch) |
| Health timeout | Check reverse proxy → `127.0.0.1:3001`, API container logs |
| verify fails on species count | Wait for seed to finish; check API logs for `db:seed` |
| Web 404 | Rebuild web image after changing `VITE_API_BASE_URL` |
