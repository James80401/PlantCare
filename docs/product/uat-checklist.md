# User acceptance testing (UAT) checklist

> **Owner:** James80401 · **Branch:** `main` (default)  
> Last run: **2026-05-17** — `verify.mjs` **25/25**, integrations OK, Playwright **20/20** (`npm run uat:e2e`).

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
- [x] `npm run test` (API — 19 tests)
- [x] `npm run test -w @plant-care/web` (Vitest — 6 tests)
- [x] `npm run verify` / `node scripts/verify.mjs` (25 checks)
- [x] `npx tsx scripts/verify-care-guides.mjs`
- [x] `node scripts/verify-species-catalog.mjs`
- [x] `npm run test:integrations` (SMTP + OpenAI)
- [x] `npm run uat:e2e` (Playwright desktop + mobile — 20 tests)

## C. Auth and accounts (testers)

- [x] SMTP configured and verifies (`test:integrations`)
- [x] Register → verification message shown (Playwright + API verify path)
- [ ] Forgot / reset password end-to-end (click email link in inbox — manual)
- [x] Premium: all new users get `PREMIUM` (DB + JWT); verify script confirms tier

## D. Core user flows

- [x] Landing → register → garden dashboard (Playwright: landing links; register shows verify email)
- [x] Species search: houseplant, herb, outdoor (API + Playwright: monstera, basil, Magic Carpet Thyme)
- [x] Browse plants catalog paginated (`/garden/plants/browse` — Playwright)
- [x] Outdoor location → no MIST tasks (API)
- [x] Change location → `tasksRescheduled` (API)
- [x] Dashboard: metrics and greeting (Playwright; weather API OK after lat/lon in verify)
- [x] Tasks page: grouped by type; complete task (Playwright + API)
- [x] Skip task with reason (API)
- [x] Task instructions modal (Playwright: Care steps dialog)
- [x] Plant profile: sections, care guide, journal entry (Playwright + API journal)
- [x] Dr. Plant chat (API — OpenAI)
- [x] One-shot diagnosis (API — OpenAI)
- [x] Schedule suggestions endpoint (API — 0+ suggestions; UI apply when suggestions exist)

## E. Mobile QA (browser / device)

- [x] Empty garden state readable, no horizontal scroll (Playwright mobile)
- [x] Active garden: bottom nav does not cover content (`pb-24` + Playwright)
- [ ] Overdue tasks visually distinct (manual spot-check with overdue plant)
- [ ] All-caught-up state shows useful next action (manual spot-check)
- [x] Tap targets comfortable on phone width (Playwright: nav ≥44px)

## F. Pre-release for remote testers

- [x] Local: `FRONTEND_URL` / `CORS_ORIGIN` = `http://localhost:5173` (`.env.example`)
- [ ] Production/staging: set both to public web URL before sharing link
- [x] Tester instructions below
- [x] Known limitations listed below

---

## Tester setup (share with UAT group)

1. **URL:** `http://localhost:5173` (local) or your deployed frontend URL.
2. **Register** with a real email if SMTP is on; click the verification link, then sign in.
3. **Without SMTP:** leave `SMTP_USER` / `SMTP_PASS` empty — accounts are auto-verified on register.
4. **Premium:** enabled for everyone in dev (`ALL_USERS_PREMIUM` / auth service).
5. **Dr. Plant / diagnosis:** require `OPENAI_API_KEY` in server `.env`.
6. **Weather on dashboard:** set location in notification/settings after login.

### Run automated UAT locally

```bash
npm run dev:api    # terminal 1
npm run dev:web    # terminal 2
npm run verify
npm run test:integrations
npm run uat:e2e
```

### Known limitations (not blocking UAT)

- Task snooze not implemented
- Section 9 engagement / gamification not shipped
- Capacitor native build needs `VITE_API_BASE_URL` pointing at a reachable API
- Password reset and verification emails only when SMTP is configured

## Sign-off

| Role | Name | Date | Notes |
|------|------|------|-------|
| Dev | Automated 2026-05-17 | | B–E mostly green; 3 manual items left |
| UAT lead | | | Inbox reset link; overdue/caught-up UI; staging URL |
