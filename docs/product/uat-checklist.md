# User acceptance testing (UAT) checklist

> **Owner:** James80401 · **Branch:** `main` (default)  
> Last run: **2026-05-21** — run `npm run verify` and `npm run uat:e2e` after `db:push` on target DB; `npm run staging:smoke` for Docker Postgres.

## A. Environment and database

- [x] `npm install` at repo root
- [x] Copy `.env.example` → `.env` (secrets filled, file saved)
- [x] `npm run db:generate`
- [x] `npm run db:push`
- [x] `npm run db:seed` (320 species, ~3852 care guides across 12 task types)
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
- [x] Outdoor location → no MIST tasks (API)
- [x] Change location → `tasksRescheduled` (API)
- [x] Dashboard: metrics and greeting (Playwright)
- [x] Tasks page: grouped by type; complete task (Playwright + API)
- [x] Skip task with reason (API)
- [x] Task instructions modal (Playwright)
- [x] Add plant: photo identify or search-by-name wizard (`/garden/plants/new` — Playwright)
- [x] Onboarding wizard + gate (`tests/e2e/onboarding.spec.ts` full flow; other E2E users skip in `global-setup`)
- [x] Household Care Share (`/garden/household` — Playwright)
- [x] Community feed (`/garden/community` — Playwright)
- [x] Community post like + comment (Playwright + `verify.mjs` like endpoint)
- [x] Mobile bottom nav: Community (`Tips` tab — Playwright mobile)
- [x] Dashboard shared plants filter + badge
- [x] Plant profile: sections, care guide, journal entry (Playwright + API)
- [x] Dr. Plant chat (API — OpenAI)
- [x] One-shot diagnosis (API — OpenAI)
- [x] Schedule suggestions endpoint (API)
- [x] Weather advice: on-demand button + daily cache (`verify.mjs` + dashboard panel)
- [x] Plant Buddy: create + home, activities, quests, seasonal, shop (`verify.mjs` + `smoke:buddy`)
- [x] Plant Buddy: shop rejects insufficient dewdrops (`verify.mjs`)
- [x] Plant Buddy: home + activities pages (Playwright `uat.spec.ts`)
- [x] Device push token registration API (`verify.mjs` POST `/devices`)

## G4. Play closed testing (Android)

- [ ] `npm run mobile:store-check` passes locally
- [ ] `npm run mobile:store-check -- --live` passes against production URLs
- [ ] `apps/web/.env.local` has production `VITE_API_BASE_URL`
- [ ] Signed AAB uploaded to Internal or Closed track
- [ ] Privacy policy URL live in Play Console
- [ ] Listing copy from [play-store-listing.md](play-store-listing.md)
- [ ] At least one tester installed via opt-in link

Runbook: [google-play-closed-testing.md](google-play-closed-testing.md)

## E2. Accessibility (H2)

- [x] Skip link targets `#main-content`
- [x] Form errors use `role="alert"`; loading uses `role="status"`
- [x] Task snooze/skip panels expose `aria-controls` + named regions
- [x] Playwright: landmarks test in `uat.spec.ts`
- [ ] Manual: VoiceOver/NVDA on one complete + skip flow per release

## E. Mobile QA (browser / device)

- [x] Empty garden state readable, no horizontal scroll (Playwright mobile)
- [x] Active garden: bottom nav does not cover content (`page-garden` safe-area padding + Playwright)
- [x] Overdue tasks visually distinct (Playwright: overdue metric + attention card)
- [x] All-caught-up state shows useful next action (Playwright: “Nothing due” + observation CTA)
- [x] Tap targets comfortable on phone width (Playwright: nav ≥44px)

## F. Pre-release for remote testers

- [x] Local dev: `FRONTEND_URL` / `CORS_ORIGIN` = `http://localhost:5173` (`.env.example`)
- [x] Docker staging: `FRONTEND_URL` / `CORS_ORIGIN` = `http://localhost:8080` (`.env.staging.example` + `npm run staging:smoke`)
- [ ] Production: set `FRONTEND_URL` and `CORS_ORIGINS` in `.env.production`, deploy stack, then:
  - [ ] `npm run production:check` (static secrets + HTTPS/CORS rules)
  - [ ] `npm run production:signoff` (live health/CORS/web + `verify` + `smoke:buddy`)
  - [ ] Optional: `npm run production:signoff -- --e2e` (Playwright on public web)
  - [ ] Record: `npm run production:signoff -- --write docs/operations/signoffs/<date>.md`
  - [ ] Runbook: [production-signoff.md](../operations/production-signoff.md)
- **2026-06-05 — live probes signed off ✓:** after deploying `0b686c3`,
  `production:signoff --live-only --skip-verify` returned **PASS** — health,
  readiness (db + uploads), CORS (`drplant.app`), and web all HTTP 200. Artifact
  written to `docs/operations/signoffs/2026-06-05-production-signoff.md`
  (gitignored — operator-local). **Deferred:** `verify` / `smoke:buddy` / `--e2e`
  register users and need the prod `DATABASE_URL`, so run them from an operator
  environment to fully close G3.
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

- Task snooze: available on dashboard/calendar task rows (`PATCH /tasks/:id/snooze`, 1/3/7 days); profile Tasks tab may not expose snooze yet
- Capacitor native build needs `VITE_API_BASE_URL` pointing at a reachable API
- Password reset requires SMTP (token flow is tested in CI when SMTP is configured)

## Sign-off

| Role | Name | Date | Notes |
|------|------|------|-------|
| Dev | Automated 2026-05-18 | | Local UAT automated; staging URL pending deploy |
| Ops | Automated (Claude) | 2026-06-05 | Deployed `0b686c3`; live production sign-off PASS (health/readiness/CORS/web). Deeper `verify`/`smoke:buddy`/`uat:e2e` deferred — need prod `DATABASE_URL`. |
| UAT lead | | | Confirm production env URLs when staging is live |
