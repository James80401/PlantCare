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

## Tier B — Analytics funnel wiring ⏳ PLANNED

The funnel events are defined but mostly not emitted at real activation points.

- [x] `page_view` with `{ path, routeType, siteMode, indexable }` — **already done** in
  `apps/web/src/seo/Seo.tsx`.
- [ ] **B1 — `marketing_cta_click`** on every marketing CTA (`pages/marketing/MarketingPage.tsx`)
  with `{ route, target, label, siteMode }`.
- [ ] **B2 — `signup_complete` properties** `{ requiresVerification, requiresAdminApproval }`
  (`pages/Register.tsx`).
- [ ] **B3 — `first_plant_added`** via `trackOnce` at first successful plant add, `{ speciesId }`.
- [ ] **B4 — `first_dr_plant_message`** via `trackOnce` at first successful Dr. Plant chat reply,
  `{ plantId }`.
- [ ] **B5 — `first_task_completed`** via `trackOnce` at first task completion, `{ source }`.
- [ ] **B6 — Reconcile event names** — keep existing per-event `PlantAdded`/`TaskCompleted`/
  `DiagnoseSubmitted`; the `first_*` events are once-per-browser activation markers (different purpose).
- [ ] **B7 — Tests** for the new emissions (mock `trackEvent`/`gtag`, assert props).
- _Deferred (not code now):_ choosing an analytics provider (GA4/Plausible/PostHog); no ad pixels pre-launch.

**Acceptance:** every funnel event in the playbook's Analytics Plan fires once at the right moment
with its required properties; `trackOnce` keys are stable; web tests green.

---

## Tier C — Prerendering (Gate-5 launch blocker) ⏳ PLANNED

Marketing metadata is runtime-only today (injected after hydration), so non-JS crawlers and social
scrapers see an empty shell. This is the single biggest item and the key launch blocker.

- [ ] **C1 — Choose approach** — static prerender of the marketing subtree (e.g. `vite-react-ssg`,
  `react-snap`, or a custom route-crawling Vite plugin). Lowest-lift option that fits the static
  `dist/` deploy; leave `/garden` + app routes as a pure SPA.
- [ ] **C2 — Emit static HTML per indexable marketing route** with unique `<title>`, description,
  canonical, OG, Twitter card, and JSON-LD **in the raw HTML response** (not after hydration).
- [ ] **C3 — Keep private/teaser-noindex correct** — prerender must not change the noindex posture;
  the A1 assertion must still pass for private builds.
- [ ] **C4 — Raw-HTML verification** — assert `dist/<route>/index.html` contains `<title>`,
  `og:title`, and `application/ld+json` (extend A1-style checks / add a launch-mode check).
- [ ] **C5 — Docs** — record the prerender step and how to verify with `view-source` + a scraper-side
  debugger (Facebook Sharing Debugger / LinkedIn Post Inspector).

**Acceptance:** Gate-5 prerender requirement met — every indexable route is a static HTML file with
correct metadata + JSON-LD in source.

---

## Tier D — Content quality & Core Web Vitals ⏳ PLANNED

Required before any guide is indexed (playbook rubric: minimum 12/14).

- [ ] **D1 — Problem detail blocks** — symptom overview, quick checks, recovery steps, mistakes to
  avoid, when to ask for help, CTA to diagnosis (`MarketingPage.tsx` + registry data).
- [ ] **D2 — Species guide blocks** — care rhythm, beginner risks, symptom links, CTA to create a schedule.
- [ ] **D3 — Beginner guide sections** — first week, how to tell soil is dry, when not to fertilize,
  recovering from overwatering.
- [ ] **D4 — Pet-toxicity one-line note** on species pages (point to ASPCA / local vet; no toxicity claims).
- [ ] **D5 — Internal linking** — specific→general (problem → diagnosis app) and general→specific
  (hub → guides) per the keyword-to-URL map.
- [ ] **D6 — CWV hygiene** — `width`/`height` on hero/images (CLS), `font-display` (LCP), avoid
  hydration jank (INP). Targets: LCP < 2.5s, INP < 200ms, CLS < 0.1, Lighthouse mobile ≥ 85.
- [ ] **D7 — Real raster OG image** — replace `/icons/icon.svg` social image with a PNG/JPg (SVG OG
    is unreliable for scrapers).
- [ ] **D8 — Organization `sameAs`** — populate `structuredData.ts` with official social URLs once handles exist.

**Acceptance:** each indexed guide scores ≥ 12/14 on the content rubric; CWV targets met on `/`,
one problem page, one species guide.

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
