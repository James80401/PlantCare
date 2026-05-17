# User acceptance testing (UAT) checklist

> **Owner:** James80401 · **Branch:** `PlantCare`  
> Last automated run: **2026-05-16** — 17/17 `verify.mjs`, integrations OK, build + tests green.

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
- [x] `node scripts/verify.mjs` (17 checks — auth, plants, tasks, skip, outdoor/MIST, diagnosis, chat)
- [x] `npx tsx scripts/verify-care-guides.mjs`
- [x] `node scripts/verify-species-catalog.mjs`
- [x] `npm run test:integrations` (SMTP + OpenAI)

## C. Auth and accounts (testers)

- [x] SMTP configured and verifies (`test:integrations`)
- [ ] Register → verify email → login (manual in browser; API path tested via verify script with auto-verify fallback)
- [ ] Forgot / reset password (manual; requires inbox access)
- [x] Premium: all new users get `PREMIUM` (DB + JWT); verify script confirms tier

## D. Core user flows (manual in browser)

API-covered in `verify.mjs` — still walk through UI once before inviting testers.

- [ ] Landing → register → garden dashboard
- [ ] Species search: houseplant, herb, outdoor (e.g. Magic Carpet Thyme)
- [x] Outdoor location → no MIST tasks (API)
- [x] Change location → `tasksRescheduled` (API)
- [ ] Dashboard: today care, metrics, weather note (set lat/lon in settings)
- [ ] Tasks page: grouped by type; complete task
- [x] Skip task with reason (API)
- [ ] Task instructions modal (sections + images)
- [ ] Plant profile: sections, care guide, journal entry
- [x] Dr. Plant chat (API — OpenAI)
- [x] One-shot diagnosis (API — OpenAI)
- [ ] Schedule suggestions on dashboard (apply/dismiss if shown)

## E. Mobile QA (browser / device)

- [ ] Empty garden state readable, no horizontal scroll
- [ ] Active garden: bottom nav does not cover content
- [ ] Overdue tasks visually distinct
- [ ] All-caught-up state shows useful next action
- [ ] Tap targets comfortable on phone width

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

### Known limitations (not blocking UAT)

- Task snooze not implemented
- Section 9 engagement / gamification not shipped
- Capacitor native build needs `VITE_API_BASE_URL` pointing at a reachable API
- Password reset and verification emails only when SMTP is configured

## Sign-off

| Role | Name | Date | Notes |
|------|------|------|-------|
| Dev | Auto run 2026-05-16 | | B + API parts of D done |
| UAT lead | | | Browser + mobile sections |
