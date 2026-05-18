# User acceptance testing (UAT) checklist

> **Owner:** James80401 · **Branch:** `main` (default)  
> Last run: **2026-05-18** — run `npm run verify` and `npm run uat:e2e` after `db:push` on target DB.

## A. Environment and database

- [x] `npm install` at repo root
- [x] Copy `.env.example` → `.env` (secrets filled, file saved)
- [x] `npm run db:generate`
- [x] `npm run db:push`
- [x] `npm run db:seed` (320 species, 2247 care guides)
- [x] API starts: `npm run dev:api` (port 3001)
- [x] Web starts: `npm run dev:web` (port 5173)

## B. Automated verification

- [x] `npm run build` (shared + api + web)
- [x] `npm run test` (API unit tests)
- [x] `npm run test -w @plant-care/web` (Vitest)
- [x] `npm run verify` / `node scripts/verify.mjs`
- [x] `npx tsx scripts/verify-care-guides.mjs`
- [x] `node scripts/verify-species-catalog.mjs`
- [x] `npm run test:integrations` (SMTP + OpenAI)
- [x] `npm run uat:e2e` (Playwright desktop + mobile)

## C. Auth and accounts (testers)

- [x] SMTP configured and verifies (`test:integrations`)
- [x] Register → verification message shown (Playwright + API verify path)
- [x] Forgot / reset password end-to-end (`verify.mjs` token path + Playwright reset page when SMTP on)
- [x] Premium: all new users get `PREMIUM` (DB + JWT); verify script confirms tier

## D. Core user flows

- [x] Landing → register → garden dashboard (Playwright)
- [x] Species search: houseplant, herb, outdoor (API + Playwright)
- [x] Browse plants catalog paginated (`/garden/plants/browse` — Playwright)
- [ ] Browse: beginner-friendly / succulent filters, sort (name, water cadence), species detail page (`/garden/plants/browse/:id`)
- [x] Outdoor location → no MIST tasks (API)
- [x] Change location → `tasksRescheduled` (API)
- [x] Dashboard: metrics and greeting (Playwright)
- [x] Tasks page: grouped by type; complete task (Playwright + API)
- [x] Skip task with reason (API)
- [x] Task instructions modal (Playwright)
- [x] Plant profile: sections, care guide, journal entry (Playwright + API)
- [x] Dr. Plant chat (API — OpenAI)
- [x] One-shot diagnosis (API — OpenAI)
- [x] Schedule suggestions endpoint (API)
- [x] Weather advice: on-demand button + daily cache (`verify.mjs` + dashboard panel)

## E. Mobile QA (browser / device)

- [x] Empty garden state readable, no horizontal scroll (Playwright mobile)
- [x] Active garden: bottom nav does not cover content (`pb-24` + Playwright)
- [x] Overdue tasks visually distinct (Playwright: overdue metric + attention card)
- [x] All-caught-up state shows useful next action (Playwright: “Nothing due” + observation CTA)
- [x] Tap targets comfortable on phone width (Playwright: nav ≥44px)

## F. Pre-release for remote testers

- [x] Local dev: `FRONTEND_URL` / `CORS_ORIGIN` = `http://localhost:5173` (`.env.example`)
- [x] Docker staging: `FRONTEND_URL` / `CORS_ORIGIN` = `http://localhost:8080` (`.env.staging.example` + `npm run staging:smoke`)
- [ ] Production: set `FRONTEND_URL` and `CORS_ORIGIN` to your public URL before sharing (see [deployment.md](../operations/deployment.md))
- [x] Tester instructions below
- [x] Known limitations listed below

---

## Tester setup (share with UAT group)

1. **URL:** `http://localhost:5173` (local) or your deployed frontend URL.
2. **Register** with a real email if SMTP is on; click the verification link, then sign in.
3. **Without SMTP:** leave `SMTP_USER` / `SMTP_PASS` empty — accounts are auto-verified on register.
4. **Premium:** enabled for everyone in dev (`ALL_USERS_PREMIUM` / auth service).
5. **Dr. Plant / diagnosis:** require `OPENAI_API_KEY` in server `.env`.
6. **Weather advice:** set location in Settings (optional), then **Advise by weather** on the dashboard (once per day).

### Run automated UAT locally

```bash
npm run dev:api    # terminal 1
npm run dev:web    # terminal 2
npm run verify
npm run test:integrations
npm run uat:e2e
```

### Known limitations (not blocking UAT)

- Capacitor native build needs `VITE_API_BASE_URL` pointing at a reachable API
- Password reset requires SMTP (token flow is tested in CI when SMTP is configured)

## Sign-off

| Role | Name | Date | Notes |
|------|------|------|-------|
| Dev | Automated 2026-05-18 | | Local UAT automated; staging URL pending deploy |
| UAT lead | | | Confirm production env URLs when staging is live |
