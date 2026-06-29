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
  2. **Pre-launch SEO code subplan (Tiers A-E)** - **Tiers A, B & C done.** A & B are deployed;
     **C (prerender) is merged but a no-op in private prod** - it activates at teaser/launch.
     **Tier D content polish and CWV lab checks are done**; the only D item left is official social
     `sameAs` URLs. Tier E remains. This is the in-flight workstream.
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

### 3.4 SEO Tier C — DONE (merged; no-op in private prod until launch)
Head/metadata **prerendering** of the marketing subtree so non-JS crawlers and social scrapers get
real `title`/description/canonical/OG/JSON-LD in the initial HTML instead of an empty shell.
- `apps/web/src/seo/headTags.ts` — `buildPageHead` (single source of truth) + `injectHeadIntoHtml`.
  Consumed by **both** `Seo.tsx` (runtime DOM) and the Vite build (static HTML), so they can't drift.
- `apps/web/vite.config.ts` `closeBundle` emits `dist/<route>/index.html` per marketing route (root
  for `/`). **Skipped in private mode** → private build byte-identical, `assert:seo-private` passes.
  nginx `try_files $uri/ …` serves the per-route files.
- Verified: launch build emits per-route HTML with `index,follow` + title + canonical + OG + JSON-LD;
  private build emits no per-route dirs and stays noindex. `headTags.test.ts` locks the contract.
- **Follow-up (not blocking launch):** full-body SSR. This prerenders the `<head>`; the body still
  hydrates client-side. Googlebot renders the body on its JS pass and scrapers only need the head.

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

### 3.5 SEO Tier D content polish - DONE EXCEPT SOCIAL HANDLES
Launch-ready guide depth and scraper polish are now in code:
- Expanded `ProblemGuide` registry data with symptom overviews, quick checks, likely causes,
  recovery steps, mistakes to avoid, when-to-ask-for-help, Dr. Plant prompts, and related links.
- Expanded `SpeciesGuide` registry data with light/watering baselines, first-week setup, care
  rhythms, beginner risks, symptoms to watch, related symptom links, and cautious pet-safety notes.
- Reworked the marketing guide UI so beginner, problem, and species pages render richer sections,
  internal links, contextual CTAs, and stable product-preview dimensions.
- Replaced the SVG social image with a raster OG image at
  `apps/web/public/marketing/og-dr-plant.png`.
- Added registry tests that enforce raster social images and minimum content depth for problem and
  species guide pages.
- Added async Google Fonts loading in `apps/web/index.html` to reduce landing-page LCP.
- Lighthouse/mobile launch-mode preview passed the Tier D route set:
  `/` performance 96 / LCP 2,413 ms / CLS 0.000 / TBT 0 ms;
  `/plant-problems/yellow-leaves` performance 96 / LCP 2,258 ms / CLS 0.002 / TBT 0 ms;
  `/plant-care-guides/pothos` performance 95 / LCP 2,411 ms / CLS 0.010 / TBT 0 ms.
  Audit record: `docs/marketing/tier-d-cwv-audit-2026-06-29.md`.

---

## 4. What's left — detailed plan

Recommended order **D sameAs when handles exist → E**. Full itemized checklists live in
[`docs/marketing/prelaunch-seo-subplan.md`](./marketing/prelaunch-seo-subplan.md); the plans below
are the implementation detail for a new owner.

### Tier C — Prerendering — ✅ DONE (head/metadata). See §3.4.
Remaining optional follow-up: **full-body SSR** (render the marketing page body to HTML, not just the
head). Heavier; not required for launch. If pursued, render only the marketing subtree with a static
router and guard `window`/`localStorage`/`import.meta.env` for Node — or adopt `vite-react-ssg`.

### Tier D - Content quality & Core Web Vitals - DONE EXCEPT SOCIAL HANDLES
The code/content portion and Lighthouse lab measurement are complete. Remaining gate:
1. **Organization `sameAs`**: populate in `structuredData.ts` once official social handles exist
   (currently `[]`).
2. **Final pre-indexing content QA**: repeat shortly before launch for stale launch language and CTA
   destination fit for the chosen mode.

**Acceptance:** content structure/tests are present; Lighthouse mobile lab targets passed on `/`,
one problem page, and one species guide. Real field INP still requires post-launch/open-testing data.

### Tier E - SPA hygiene - NOT STARTED
1. **Host canonicalization**: enforce one host form (www vs non-www) with a 301 (`nginx.conf`).
2. **Trailing-slash convention**: pick one and 301 to it.
3. **Document** the host/slash choice next to `VITE_CANONICAL_BASE_URL`.
4. **Truthful `lastmod`**: keep sitemap `lastmod` accurate if/when emitted.

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
