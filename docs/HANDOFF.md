# Dr. Plant — Engineering Handoff

Last updated: 2026-06-29

A pick-up-and-continue brief for anyone taking over. Covers **where we are now**, **what was
done**, **what's left (with detailed plans)**, and the **operational gotchas** you need before
touching production.

---

## 1. TL;DR — current state

- **Product status:** Dr. Plant is **private pre-launch**. The public marketing surface exists in
  code but is `noindex` with an empty sitemap. Do **not** flip `VITE_PUBLIC_SITE_MODE=launch`
  without an explicit launch decision.
- **Two active workstreams** ran recently:
  1. **Plant Buddy visual overhaul** — 4 feedback rounds, all shipped & deployed. *Complete.*
  2. **Pre-launch SEO code subplan (Tiers A–E)** — **Tiers A & B done, deployed.** Tiers C, D, E
     remain. This is the in-flight workstream.
- **Source of truth docs:**
  - Strategy: [`docs/marketing/prelaunch-seo-funnel.md`](./marketing/prelaunch-seo-funnel.md) (the playbook)
  - Engineering tracker w/ checklists: [`docs/marketing/prelaunch-seo-subplan.md`](./marketing/prelaunch-seo-subplan.md)
  - This handoff.

---

## 2. Repo & how to work in it

Monorepo (npm workspaces): `apps/api` (NestJS 10 + Prisma), `apps/web` (React 19 + Vite 6 +
Tailwind v4 + Vitest), `packages/shared`. Run everything from `C:\Source\Repos\PlantCare`.

```bash
# Web
npm run test  -w @plant-care/web          # vitest (jsdom)
npm run build -w @plant-care/web          # defaults to PRIVATE mode
npm run assert:seo-private -w @plant-care/web   # guardrail: dist must be private/noindex/empty-sitemap

# API
npm run test  -w @plant-care/api
npm run build -w @plant-care/api

# Inspect a launch build (NEVER deploy without a launch decision)
VITE_PUBLIC_SITE_MODE=launch npm run build -w @plant-care/web
```

**Workflow:** branch → build/test/verify → fast-forward merge to `main` → push → delete branch.
End commit messages with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

**Deploy (production):** SSH `root@165.227.176.65` with `.codex-ssh/plantcare_prod_ed25519`, run
`bash scripts/deploy-on-server.sh` (server-side build, private mode). Each deploy needs **explicit
per-action authorization**. `.codex-ssh/` keys must **never** be committed. Verify after deploy:
web/API `200`, `robots.txt` has `Disallow: /`, `sitemap.xml` has 0 `<loc>`, fresh bundle hash.

**CI:** `.github/workflows/ci.yml` runs API tests + web tests + builds, then
`assert:seo-private` (fails the build if a default/private build is not noindex + empty sitemap).

---

## 3. What's been done

### 3.1 Plant Buddy visual overhaul — COMPLETE (deployed)
Iterative, feedback-driven. All four rounds shipped & verified live:
1. Clothing/accessories anchored into the character SVG; home no longer floats.
2. Always-happy (removed grey neglect state); persistent companion shows equipped style; distinct
   per-background scenes.
3. Bolder/distinct clothing shapes; richer scene detail (foreground + per-background decor).
4. Default **interior home** scene with a window onto the chosen background + a clickable house
   thumbnail to step **outside**; **lifelike idle motion** (legs step, arms wave out-of-sync, crest
   sways, body breathes — all gated under reduced-motion).
Key files: `apps/web/src/components/buddy/*` (`BuddyScene`, `BuddyRoomInterior`,
`BuddyCharacterModel`, `buddyClothingSvg`, `BuddySceneBackdrop`, `buddyBackgrounds`), animations in
`apps/web/src/index.css` + `apps/web/src/styles/buddy-animations*.css`.
> Note: an in-progress **"furnished interior spots"** idea (placeable furniture on a sofa/side
> table/dining table) was scoped but **paused** before implementation when priorities shifted to
> SEO. See "Backlog / parked" below.

### 3.2 SEO Tier A — DONE & DEPLOYED (commit `2aab080`)
Guardrails & quick wins (no launch decision needed):
- **CI private-build assertion** — `apps/web/scripts/assert-private-seo-build.mjs` + `ci.yml` step
  (CI now also runs web tests). Verifies built `dist/` is private: empty sitemap, `noindex` HTML,
  robots `Disallow: /`, no `llms.txt`. Passes private, **fails a launch build**.
- **AI-crawler policy** in `robots.txt` (`apps/web/src/seo/crawlerFiles.ts`): GPTBot/ClaudeBot/
  PerplexityBot allowed only at launch; Google-Extended/CCBot held until an explicit decision.
- **Cannibalization control**: `primaryKeyword` per route in `marketingRegistry.ts` + a uniqueness
  test (`marketingRegistry.test.ts`).
- **Real 404**: `apps/web/src/pages/NotFound.tsx` (noindex) replaces the soft-404 redirect-to-home
  in `App.tsx`.
- **`llms.txt`**: generated launch-only (absent in private/teaser).

### 3.3 SEO Tier B — DONE & DEPLOYED (commit `1494830`)
Analytics funnel. Most events were already wired by earlier launch-gate work; this tier verified
the contracts, closed gaps, and locked them in:
- Verified: `page_view` (Seo.tsx), `marketing_cta_click` (MarketingPage.tsx), `waitlist_submit`,
  `first_plant_added` (AddPlantWizard), `first_dr_plant_message` (DrPlantChat),
  `first_task_completed` (useDashboardTaskActions + useTasksInRange).
- Fixed: `signup_complete` now carries `{ requiresVerification, requiresAdminApproval }` on the
  immediate-login branch too.
- Added: `apps/web/src/utils/analytics.test.ts` (gtag forwarding, `trackOnce` fire-once dedup,
  localStorage-blocked fallback).

---

## 4. What's left — detailed plan

Recommended order **C → D → E**. Full itemized checklists live in
[`docs/marketing/prelaunch-seo-subplan.md`](./marketing/prelaunch-seo-subplan.md); the plans below
are the implementation detail for a new owner.

### Tier C — Prerendering (the Gate-5 launch blocker) — NOT STARTED
**Problem:** Marketing metadata (`title`/description/canonical/OG/Twitter/JSON-LD) is injected at
runtime by `apps/web/src/seo/Seo.tsx` **after** React hydrates. Non-JS crawlers and social scrapers
(Facebook/LinkedIn/Slack/Bing/most AI bots) read the initial HTML and stop, so they see an empty
shell. This must be fixed before any page is meant to rank or be shared.

**Plan:**
1. Pick the lowest-lift approach that fits the static `dist/` deploy: `vite-react-ssg`,
   `react-snap`, or a custom Vite plugin that crawls the marketing routes and emits static HTML.
   Prerender **only** the marketing subtree (the routes in `marketingRegistry.ts`); leave `/garden`
   and app routes as a pure SPA.
2. For each indexable marketing route, emit `dist/<route>/index.html` whose raw HTML already
   contains a unique `<title>`, description, canonical, OG, Twitter card, and JSON-LD. Reuse
   `structuredData.ts` + the registry; the data already exists — it just needs to be rendered into
   HTML at build instead of (or in addition to) at runtime.
3. Keep private/teaser-noindex correct: prerendered HTML must still be `noindex` in those modes, and
   `assert-private-seo-build.mjs` must still pass for private builds.
4. Add a verification step (extend the A1 script or add a launch-mode check) asserting that
   `dist/plant-diagnosis-app/index.html` contains `<title>`, `og:title`, and `application/ld+json`
   in source.
5. Document the prerender step; verify with `view-source:` + Facebook Sharing Debugger / LinkedIn
   Post Inspector.

**Acceptance:** every indexable route is a static HTML file with correct metadata + JSON-LD in the
raw response. Gate-5 prerender requirement met.

**Watch-outs:** Tailwind v4 + Vite 6 plugin compatibility; the app reads `import.meta.env` and
`window`/`localStorage` at module load in places — a prerenderer running in Node must guard those.
The existing `seoOutputPlugin` in `vite.config.ts` is where build-time emission already happens —
the prerender can live alongside it.

### Tier D — Content quality & Core Web Vitals — NOT STARTED
Required before any guide is indexed (playbook rubric: minimum **12/14**). Page bodies currently
render registry data but are thinner than the playbook's page briefs.
1. **Problem detail blocks** (`MarketingPage.tsx` `ProblemGuideBody`): symptom overview, quick
   checks, recovery steps, mistakes to avoid, when-to-ask-for-help, CTA. Data lives on
   `ProblemGuide` in `marketingRegistry.ts` — extend the type + entries.
2. **Species guide blocks** (`SpeciesGuideBody`): care rhythm, beginner risks, symptom links, CTA.
3. **Beginner guide sections** (first week, telling if soil is dry, when not to fertilize, recover
   from overwatering).
4. **Pet-toxicity one-line note** on species pages (point to ASPCA / local vet; make **no**
   toxicity claims).
5. **Internal linking** specific→general (problem → diagnosis app) and general→specific (hub → guides)
   per the keyword-to-URL map.
6. **CWV hygiene**: `width`/`height` on hero/images (CLS); `font-display` (LCP); avoid hydration
   jank (INP). Targets: LCP < 2.5s, INP < 200ms, CLS < 0.1, Lighthouse mobile ≥ 85.
7. **Real raster OG image**: replace `/icons/icon.svg` (`SOCIAL_IMAGE` in `marketingRegistry.ts`)
   with a PNG/JPG — SVG OG images are unreliable for scrapers.
8. **Organization `sameAs`**: populate in `structuredData.ts` once official social handles exist
   (currently `[]`).

**Acceptance:** each indexed guide scores ≥ 12/14; CWV targets met on `/`, one problem page, one
species guide.

### Tier E — SPA hygiene — NOT STARTED
1. **Real 404 status**: today unknown paths return `200` + the (noindex) SPA shell via nginx
   `try_files … /index.html` — a soft 404. Tier A shipped the *noindex NotFound page* (the
   doc-accepted alternative); a true `404` **status** needs nginx (or prerender) route-awareness.
   Decide and implement in `apps/web/nginx.conf`.
2. **Host canonicalization**: enforce one host form (www vs non-www) with a 301 (`nginx.conf`).
3. **Trailing-slash convention**: pick one and 301 to it.
4. **Document** the host/slash choice next to `VITE_CANONICAL_BASE_URL`. Keep sitemap `lastmod`
   truthful if/when emitted.

---

## 5. Key files map (SEO)

| Concern | File |
|---|---|
| Site modes / indexability | `apps/web/src/seo/siteConfig.ts` |
| Route registry + metadata + `primaryKeyword` | `apps/web/src/seo/marketingRegistry.ts` |
| robots.txt / sitemap.xml / llms.txt builders | `apps/web/src/seo/crawlerFiles.ts` |
| Runtime metadata + `page_view` | `apps/web/src/seo/Seo.tsx` |
| JSON-LD builders (Org/SoftwareApp/Breadcrumb/Article) | `apps/web/src/seo/structuredData.ts` |
| Marketing page UI | `apps/web/src/pages/marketing/MarketingPage.tsx` |
| Build-time crawler emission + robots meta | `apps/web/vite.config.ts` (`seoOutputPlugin`) |
| Protected-path `X-Robots-Tag` | `apps/web/nginx.conf` |
| Private-build CI guardrail | `apps/web/scripts/assert-private-seo-build.mjs`, `.github/workflows/ci.yml` |
| Analytics events | `apps/web/src/utils/analytics.ts` (+ `.test.ts`) |
| 404 | `apps/web/src/pages/NotFound.tsx` |

---

## 6. Gotchas & constraints

- **Private until explicit launch.** Never set `VITE_PUBLIC_SITE_MODE=launch` without a decision.
  CI + `assert:seo-private` exist to catch accidental exposure — keep them green.
- **Deploys need per-action authorization** and use the `.codex-ssh/` key (never commit it).
- **Buddy scene screenshots are unreliable** (continuous `setInterval` re-renders + a global
  floating companion); verify buddy changes via `preview_eval` DOM measurement, not screenshots.
- **`tsc --noEmit` has pre-existing repo-wide type debt** unrelated to current work; use the web
  test suite + Vite build as the verification baseline.
- The marketing surface only renders in dev, protected preview, or non-private modes
  (`shouldRenderMarketingRoutes`); in strict private it redirects guests to `/login`.

## 7. Backlog / parked
- **Buddy furnished-interior spots** (placeable furniture on sofa/side table/dining table, owned
  items rendered on each spot; WYSIWYG placement in `TerrariumView`). Scoped, **not implemented**.
  `terrariumLayout` is free-form JSON (`@IsObject()`), so no backend change is needed.
- Post-launch SEO/product/analytics expansion: see the playbook's "Backlog After Launch".
