# Dr. Plant Pre-Launch SEO — Code Subplan & Tracker

Last updated: 2026-06-29

This is the **in-app, code-actionable** execution tracker for
[`prelaunch-seo-funnel.md`](./prelaunch-seo-funnel.md). The playbook is the strategy; this
document is the engineering checklist. Only items that are implemented through code and live
inside the application are tracked here. Marketing/ops work (handle reservation, Search
Console/Bing setup, social asset bank, PR/outreach, app-store submission) is **out of scope**
and intentionally excluded.

**Hard constraint:** Dr. Plant is private pre-launch. Do **not** set
`VITE_PUBLIC_SITE_MODE=launch` without an explicit launch decision. Every change below must keep
the private build noindex with an empty sitemap (now enforced by CI — see A1).

Status legend: `[x]` done & verified · `[~]` in progress · `[ ]` planned.

Recommended order: **A → B → C → D → E** (we are working one tier at a time).

---

## Tier A — Guardrails & quick wins ✅ DONE (commit `2aab080`, 2026-06-29)

Low-risk, high-value items that need no launch decision. All verified.

- [x] **A1 — CI private-build assertion**
  - [x] `apps/web/scripts/assert-private-seo-build.mjs` inspects built `dist/` and fails unless:
    empty sitemap (no `<url>`/`<loc>`), `index.html` is `noindex,nofollow`, robots has
    `User-agent: *` → `Disallow: /`, and **no** `llms.txt` leaked.
  - [x] `assert:seo-private` npm script in `apps/web/package.json`.
  - [x] Wired into `.github/workflows/ci.yml` after the web build; CI now **also runs the web
    test suite** (previously only API tests ran).
  - [x] Verified: passes the default/private build; **correctly fails** a `launch` build.
- [x] **A2 — AI / answer-engine crawler policy in `robots.txt`** (`apps/web/src/seo/crawlerFiles.ts`)
  - [x] `GPTBot`, `ClaudeBot`, `PerplexityBot` → allowed **only** when the marketing surface is
    indexable (launch); disallowed in private/teaser.
  - [x] `Google-Extended`, `CCBot` → **held** (disallowed) until an explicit decision.
  - [x] Allowed AI bots still `Disallow:` the auth/app prefixes (per-UA groups override `*`).
  - [x] Unit-tested across private / teaser-noindex / launch.
- [x] **A3 — Cannibalization control (keyword-to-URL map)** (`apps/web/src/seo/marketingRegistry.ts`)
  - [x] Added `primaryKeyword` to `MarketingRouteMeta`; every route owns exactly one head/long-tail term.
  - [x] Core routes set explicitly; problem pages derive `"{symptom} on houseplant"`, species pages
    derive `"{common name} care"` (specific terms only — never a hub head term).
  - [x] `marketingRegistry.test.ts` asserts non-empty + globally unique primary keywords + unique paths.
- [x] **A4 — Real 404 (soft-404 fix)**
  - [x] `apps/web/src/pages/NotFound.tsx` (noindex via global `<Seo/>`, back-link home).
  - [x] `apps/web/src/App.tsx` catch-all renders `NotFound` instead of `<Navigate to="/">`.
  - [x] Verified live: URL preserved, `robots=noindex,nofollow`.
- [x] **A5 — `llms.txt`** (`buildLlmsTxt` in `crawlerFiles.ts`, emitted by `vite.config.ts`)
  - [x] Lists product + key public pages; emitted **launch-only** (absent in private/teaser).

**Tier A verification:** 117 web tests pass (incl. new `crawlerFiles.test.ts` +
`marketingRegistry.test.ts`); private build + assertion green; launch build emits the 22-URL
sitemap + `llms.txt` and the assertion rejects it. Not yet deployed (deploy optional — only the
404 page + CI change behavior; the live site stays private).

---

## Tier B — Analytics funnel wiring ✅ DONE (2026-06-29)

Most of this was already wired by the earlier SEO launch-gate work; this tier verified the
contracts, closed two gaps, and locked them in with tests.

- [x] `page_view` with `{ path, routeType, siteMode, indexable }` — `apps/web/src/seo/Seo.tsx`.
- [x] **B1 — `marketing_cta_click`** `{ route, target, label, siteMode }` — `MarketingPage.tsx`
  (`trackCta`, also still emits `waitlist_submit` for the waitlist route).
- [x] **B2 — `signup_complete` properties** `{ requiresVerification, requiresAdminApproval }` —
  `Register.tsx`. Closed the gap on the immediate-login branch (now sends `false/false` instead of
  no props).
- [x] **B3 — `first_plant_added`** via `trackOnce`, `{ speciesId }` — `AddPlantWizard.tsx`.
- [x] **B4 — `first_dr_plant_message`** via `trackOnce`, `{ plantId }` — `DrPlantChat.tsx`.
- [x] **B5 — `first_task_completed`** via `trackOnce`, `{ source }` — `useDashboardTaskActions.ts`
  + `useTasksInRange.ts`.
- [x] **B6 — Event names reconciled** — per-event `PlantAdded`/`TaskCompleted`/`DiagnoseSubmitted`
  kept alongside the once-per-browser `first_*` activation markers (different purpose).
- [x] **B7 — Tests** — `apps/web/src/utils/analytics.test.ts` covers `gtag` forwarding, `trackOnce`
  fire-once-per-key dedup, and the localStorage-unavailable fallback.
- _Deferred (not code now):_ choosing an analytics provider (GA4/Plausible/PostHog); no ad pixels pre-launch.

**Acceptance met:** every funnel event in the playbook's Analytics Plan fires once at the right
moment with its required properties; `trackOnce` keys are stable; web tests green.

---

## Tier C — Prerendering (Gate-5 launch blocker) ✅ DONE (2026-06-29)

Marketing metadata was runtime-only (injected after hydration), so non-JS crawlers and social
scrapers saw an empty shell. Implemented **head/metadata prerendering**: a shared head builder feeds
both runtime and build time, and the Vite build emits a per-route static HTML file with the full
`<head>` baked in.

- [x] **C1 — Approach** — custom Vite plugin step (`closeBundle` in `vite.config.ts`), no new heavy
  deps. Prerenders only the marketing-registry routes; `/garden` + app routes stay a pure SPA.
- [x] **C2 — Per-route static HTML** — `dist/<route>/index.html` (and the root for `/`) with unique
  `<title>`, description, canonical, robots, OG, Twitter, and JSON-LD **in the raw response**. nginx
  `try_files $uri/ …` serves the per-route file. New `apps/web/src/seo/headTags.ts`
  (`buildPageHead` + `injectHeadIntoHtml`) is the single source of truth, also consumed by `Seo.tsx`
  at runtime so the two can't drift.
- [x] **C3 — Private stays clean** — prerender is **skipped in private mode**, so the private build is
  byte-identical and `assert:seo-private` still passes (verified: no per-route dirs, root stays noindex).
- [x] **C4 — Verification** — `apps/web/src/seo/headTags.test.ts` asserts the head/inject output;
  launch build verified to emit `index,follow` + title + canonical + OG + JSON-LD per route.
- [x] **C5 — Docs** — recorded here + in `docs/HANDOFF.md`.
- [ ] **Follow-up (not blocking launch): full-body SSR.** This tier prerenders the `<head>` (the
  playbook's stated acceptance: metadata + JSON-LD in raw HTML). Rendering the page **body** to HTML
  (better for no-JS users / ranking body signals) is the playbook's heavier "Full SSR" option and is
  deferred — Googlebot renders the SPA body on its JS pass, and scrapers only need the head.

**Acceptance met:** every marketing route emits a static HTML file with correct metadata + JSON-LD in
source (in non-private builds). Deploying this to **private** prod is a no-op by design — it activates
when the site mode becomes teaser/launch.

---

## Tier D - Content quality & Core Web Vitals DONE EXCEPT SOCIAL HANDLES (2026-06-29)

Required before any guide is indexed (playbook rubric: minimum 12/14). The code/content portion is
implemented and covered by tests. Lighthouse/mobile lab measurement now passes on the representative
route set. Remaining work is blocked on official social handles for Organization `sameAs`.

- [x] **D1 - Problem detail blocks** - symptom overview, quick checks, likely causes, recovery steps,
  mistakes to avoid, when to ask for help, contextual Dr. Plant prompt, and related links
  (`MarketingPage.tsx` + expanded `ProblemGuide` registry data).
- [x] **D2 - Species guide blocks** - light baseline, watering baseline, first-week setup, care
  rhythm, beginner risks, symptoms to watch, pet-safety note, symptom links, and CTA to create a
  schedule.
- [x] **D3 - Beginner guide sections** - first week, how to tell soil is dry, when not to fertilize,
  and recovering from overwatering.
- [x] **D4 - Pet-safety note** on species pages. Notes are intentionally cautious and point to
  ASPCA, a veterinarian, or a local expert instead of making hard toxicity claims.
- [x] **D5 - Internal linking** - problem pages link to diagnosis/watering/beginner flows; species
  pages link back into relevant symptom guides; hubs link into the detailed guide pages.
- [x] **D6 - CWV hygiene** - marketing hero/product preview has stable dimensions, the new OG image
  is a static raster asset, and Google Fonts now load asynchronously with a `noscript` fallback to
  reduce render-blocking LCP delay. Lighthouse/mobile launch-mode preview results:
  - `/` - performance 96, LCP 2,413 ms, CLS 0.000, TBT 0 ms.
  - `/plant-problems/yellow-leaves` - performance 96, LCP 2,258 ms, CLS 0.002, TBT 0 ms.
  - `/plant-care-guides/pothos` - performance 95, LCP 2,411 ms, CLS 0.010, TBT 0 ms.
  - Lab note: Lighthouse uses TBT as the interaction proxy; real INP requires field data after
    launch/open testing.
- [x] **D7 - Real raster OG image** - replaced `/icons/icon.svg` social image with
  `/marketing/og-dr-plant.png` for scraper compatibility.
- [ ] **D8 - Organization `sameAs`** - populate `structuredData.ts` with official social URLs once
  handles exist.

**Acceptance status:** content structure/tests and Lighthouse lab targets are in place for
launch-ready guide pages. See [`tier-d-cwv-audit-2026-06-29.md`](./tier-d-cwv-audit-2026-06-29.md).
Only Organization `sameAs` remains, pending official social URLs.

---

## Tier E — SPA hygiene ⏳ PLANNED

- [ ] **E1 — Host canonicalization** — enforce one host form (www vs non-www) with a 301 (`nginx.conf`).
- [ ] **E2 — Trailing-slash convention** — pick one and 301 to it.
- [ ] **E3 — Document** the host/trailing-slash choice next to `VITE_CANONICAL_BASE_URL`.
- [ ] **E4 — Truthful `lastmod`** — keep sitemap `lastmod` accurate if/when emitted (already optional).

**Acceptance:** one canonical host + slash form enforced by redirect; documented.

---

## Verification reference

- Web tests: `npm run test -w @plant-care/web`
- Private build + guardrail: `npm run build -w @plant-care/web && npm run assert:seo-private -w @plant-care/web`
- Launch build (inspection only — never deploy without a launch decision):
  `VITE_PUBLIC_SITE_MODE=launch npm run build -w @plant-care/web`
- Full QA matrix (build modes, headers, prerender, CWV, visual): see the playbook's
  [QA and Verification](./prelaunch-seo-funnel.md#qa-and-verification) section.

## Out of scope (not code)

Handle reservation · Search Console / Bing Webmaster setup · social asset bank · off-page/PR/outreach ·
app-store listing submission · choosing/installing an analytics provider. Tracked in the playbook, not here.
