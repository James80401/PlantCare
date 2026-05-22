# Guide 15 — Production deploy & Google Play (private testing)

> **Navigation:** [Guides INDEX](INDEX.md) · [Guide 12 — Mobile](12-mobile-and-client-packaging.md)

Step-by-step runbook after local dev is working. Goal: **HTTPS API** for Capacitor + optional web, then **Play Closed testing** (private).

---

## Checklist overview

| Phase | Status | Doc section |
|-------|--------|-------------|
| A. Domain + HTTPS reverse proxy | You | §1 |
| B. Server + Docker production stack | You | §2 |
| C. Smoke test public API | You | §3 |
| D. Privacy policy URL | Repo: `/privacy` route | §4 |
| E. Capacitor release build | You | §5 |
| F. Play Console closed testing | You | §6 |

---

## §1 — Domain and TLS

1. Point DNS:
   - `api.yourdomain.com` → your server IP
   - `app.yourdomain.com` → same IP (or CDN)
2. Install **Caddy** or **nginx** on the host.
3. Proxy:
   - `api.yourdomain.com` → `http://127.0.0.1:3001`
   - `app.yourdomain.com` → `http://127.0.0.1:8080`
4. Obtain Let's Encrypt certificates (Caddy does this automatically).

**Example Caddyfile snippet:**

```
api.yourdomain.com {
  reverse_proxy 127.0.0.1:3001
}
app.yourdomain.com {
  reverse_proxy 127.0.0.1:8080
}
```

Containers bind to **localhost only** (`docker-compose.production.yml`) so Postgres and API are not exposed directly.

---

## §2 — Deploy on the VPS

### On the server

```bash
git clone https://github.com/James80401/PlantCare.git
cd PlantCare
cp .env.production.example .env.production
# Edit .env.production — real secrets and URLs
```

Required edits in `.env.production`:

```env
JWT_SECRET=<64-char hex>
JWT_REFRESH_SECRET=<64-char hex>
FRONTEND_URL=https://app.yourdomain.com
CORS_ORIGINS=https://app.yourdomain.com
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
```

Copy `OPENAI_API_KEY`, `SMTP_*` from your working local `.env`.

Optional for Plant Buddy / task push on devices:

```env
FCM_SERVER_KEY=<Firebase Cloud Messaging server key>
```

Validate before starting containers:

```bash
npm run production:check
```

### Start stack

```bash
npm run production:up
```

First API start runs migrations + seed (several minutes). Watch logs:

```bash
docker compose -f docker-compose.production.yml logs -f api
```

### Managed Postgres (optional)

If using Neon/Supabase/RDS instead of the compose `postgres` service:

1. Set `DATABASE_URL` in `.env.production` to the managed URL.
2. Remove or disable the `postgres` service and `depends_on` (see host docs) or run only `api` + `web` services.

---

## §3 — Verify from your PC

```bash
API_URL=https://api.yourdomain.com/api/v1 npm run verify
API_URL=https://api.yourdomain.com/api/v1 npm run smoke:buddy
```

Optional web UAT:

```bash
UAT_WEB_URL=https://app.yourdomain.com API_URL=https://api.yourdomain.com/api/v1 npm run uat:e2e
```

Share [tester-5-minute.md](../product/tester-5-minute.md) with remote testers.

---

## §4 — Privacy policy (Play Store requirement)

The web app includes a public route:

**`https://app.yourdomain.com/privacy`**

Use that URL in Play Console. Customize copy in `apps/web/src/pages/Privacy.tsx` before release.

---

## §5 — Android release build (Capacitor)

On your dev machine (not the server):

```bash
# apps/web/.env.local or export for build
echo VITE_API_BASE_URL=https://api.yourdomain.com/api/v1 > apps/web/.env.local

npm run mobile:add:android   # once
npm run mobile:release:android
```

Opens Android Studio. Then:

1. **Build → Generate Signed Bundle / APK** → **Android App Bundle (.aab)**.
2. Create or use a **upload keystore** (save passwords securely).
3. Enable **Play App Signing** in Play Console (recommended).

**CORS:** API allows `https://localhost` and `capacitor://localhost` automatically for mobile WebViews.

---

## §6 — Google Play Closed testing (private)

1. [Play Console](https://play.google.com/console) — $25 one-time developer account.
2. Create app → package name must match Capacitor: `com.plantcare.app`.
3. Complete store listing minimums + content rating + data safety.
4. **Testing → Closed testing** → create release → upload `.aab`.
5. Add tester Google accounts (emails).
6. Share the **opt-in link** from Console — testers install via Play Store; app is **not** publicly searchable.

Stay on Closed testing until ready for Production.

Detail: [google-play-closed-testing.md](../product/google-play-closed-testing.md).

---

## Environment reference

| Variable | Production |
|----------|------------|
| `CORS_ORIGINS` | Comma-separated browser origins |
| `VITE_API_BASE_URL` | Public API URL (web + mobile build) |
| `FRONTEND_URL` | Web app URL (emails, links) |

See [.env.production.example](../../.env.production.example).

---

## Related

- [13 — Operations](13-operations-deployment-and-quality.md)
- [operations/deployment.md](../operations/deployment.md)
