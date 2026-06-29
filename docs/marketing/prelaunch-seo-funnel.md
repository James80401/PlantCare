# Dr. Plant Pre-Launch SEO, Funnel, and Traffic Playbook

Last reviewed: 2026-06-29

Dr. Plant is private by default. This guide explains how to build and review the full marketing, SEO, app-store, social, and analytics foundation before public launch without accidentally exposing the product or inviting search engines too early.

The short version: create assets now, publish intentionally later.

## Table of Contents

- [Non-Negotiables](#non-negotiables)
- [Current Implementation](#current-implementation)
- [Site Modes](#site-modes)
- [Privacy and Indexing Rules](#privacy-and-indexing-rules)
- [Route Inventory](#route-inventory)
- [Page Briefs](#page-briefs)
- [Content Quality Rules](#content-quality-rules)
- [Traffic Funnel](#traffic-funnel)
- [Analytics Plan](#analytics-plan)
- [Social and Hype Plan](#social-and-hype-plan)
- [App Store SEO Prep](#app-store-seo-prep)
- [Search Console and Webmaster Setup](#search-console-and-webmaster-setup)
- [QA and Verification](#qa-and-verification)
- [Launch Gates](#launch-gates)
- [Risk Register](#risk-register)
- [Backlog After Launch](#backlog-after-launch)
- [Source Links](#source-links)

## Non-Negotiables

These rules override every tactical idea in this document.

- Dr. Plant remains private until an explicit decision to enter teaser, open testing, phased launch, or full public launch.
- Marketing and content pages can be built ahead of time, but they must not be indexable in private mode.
- Auth and app routes must never be in the sitemap.
- Auth and app routes must always send a `noindex,nofollow` signal.
- Do not rely on `robots.txt` as the privacy control. Use access control and `noindex`.
- Do not submit a sitemap to Google or Bing until launch mode is approved.
- Do not publish AI-generated content at scale without review, sources, internal links, and product-specific value.
- Do not make medical, veterinary, toxicity, or poison-control claims. Plant care guidance is not emergency advice.
- Do not claim public traction, ratings, app-store availability, or social proof that does not exist yet.
- Do not flip `VITE_PUBLIC_SITE_MODE=launch` without an explicit launch decision.

## Current Implementation

The current implementation lives in the web app and docs.

| Area | Location | Purpose |
|------|----------|---------|
| Site mode config | `apps/web/src/seo/siteConfig.ts` | Reads `private`, `teaser`, and `launch` settings from Vite env vars. |
| Marketing registry | `apps/web/src/seo/marketingRegistry.ts` | Central source of marketing routes, metadata, sitemap priority, and indexing policy. |
| Runtime metadata | `apps/web/src/seo/Seo.tsx` | Sets title, description, canonical URL, robots meta, Open Graph, Twitter card, and JSON-LD. |
| Structured data | `apps/web/src/seo/structuredData.ts` | Builds Organization, SoftwareApplication, BreadcrumbList, and Article JSON-LD. |
| Crawler files | `apps/web/src/seo/crawlerFiles.ts` | Generates `robots.txt` and `sitemap.xml` for the selected site mode. |
| Marketing page UI | `apps/web/src/pages/marketing/MarketingPage.tsx` | Renders the Dr. Plant landing, waitlist, app, problem, and species-guide pages. |
| Vite output hook | `apps/web/vite.config.ts` | Emits crawler files and adjusts initial HTML robots mode during build. |
| Protected path noindex | `apps/web/nginx.conf` | Adds `X-Robots-Tag: noindex, nofollow` for auth and app paths. |
| Deployment env docs | `docs/operations/private-online-setup.md` | Adds private SEO env defaults to production setup. |
| This guide | `docs/marketing/prelaunch-seo-funnel.md` | Operating playbook for private pre-launch growth prep. |

The app also tracks these funnel events through `apps/web/src/utils/analytics.ts`:

- `page_view`
- `marketing_cta_click`
- `waitlist_submit`
- `signup_start`
- `signup_complete`
- `first_plant_added`
- `first_dr_plant_message`
- `first_task_completed`

## Site Modes

Dr. Plant uses three explicit site modes.

| Mode | Env | Intended state | What guests see | Search posture |
|------|-----|----------------|-----------------|----------------|
| Private | `VITE_PUBLIC_SITE_MODE=private` | Current default. Private beta and protected preview only. | Guests go to sign in unless preview is enabled. | `noindex,nofollow`; empty sitemap; robots disallows crawling. |
| Teaser | `VITE_PUBLIC_SITE_MODE=teaser` | Controlled hype, waitlist, or open-testing intake. | Landing and waitlist/access page can be exposed. | Not indexed unless `VITE_MARKETING_INDEXABLE=true`. |
| Launch | `VITE_PUBLIC_SITE_MODE=launch` | Approved public SEO launch. | Approved marketing/content pages public. | Indexable by default; sitemap includes approved URLs. |

### Private Production Defaults

Use this for the production app while it remains private:

```env
VITE_PUBLIC_SITE_MODE=private
VITE_MARKETING_INDEXABLE=false
VITE_CANONICAL_BASE_URL=https://drplant.app
```

Canonical URL convention:

- Primary host is `https://drplant.app`.
- `https://www.drplant.app` redirects to the apex host with a permanent redirect.
- Public and app paths use no trailing slash except the root path `/`.
- `VITE_CANONICAL_BASE_URL` must stay `https://drplant.app` unless the canonical host decision changes.

Expected outcome:

- `/` sends guests to `/login`.
- Marketing routes are not intended to be publicly browsable.
- `sitemap.xml` contains no URL entries.
- HTML starts with `noindex,nofollow`.
- Protected app routes send `X-Robots-Tag: noindex, nofollow`.

### Protected Marketing Preview

Use this only behind a real access gate such as Cloudflare Access or Caddy Basic Auth on a preview hostname.

```env
VITE_PUBLIC_SITE_MODE=private
VITE_ENABLE_MARKETING_PREVIEW=true
VITE_MARKETING_INDEXABLE=false
VITE_CANONICAL_BASE_URL=https://drplant.app
```

Recommended hostname:

```text
preview.drplant.app
```

Expected outcome:

- Marketing routes render for review.
- Routes still use `noindex,nofollow`.
- Sitemap remains empty.
- Preview URL should not be shared publicly.

### Teaser Mode

Use teaser mode when the product is still private but we intentionally want one controlled public surface for social accounts, waitlist traffic, or invite requests.

```env
VITE_PUBLIC_SITE_MODE=teaser
VITE_MARKETING_INDEXABLE=false
VITE_CANONICAL_BASE_URL=https://drplant.app
```

Expected outcome:

- `/` and `/waitlist` can be public.
- Search indexing remains off by default.
- Social links can point at `/waitlist?utm_source=...`.
- App access still requires login/approval.

Only set this when an indexed teaser is explicitly approved:

```env
VITE_MARKETING_INDEXABLE=true
```

### Launch Mode

Use launch mode only when public SEO launch is approved.

```env
VITE_PUBLIC_SITE_MODE=launch
VITE_CANONICAL_BASE_URL=https://drplant.app
```

`VITE_MARKETING_INDEXABLE` can be omitted because launch mode defaults to indexable.

Expected outcome:

- Marketing, problem, and species-guide routes are public.
- Sitemap contains only approved marketing/content URLs.
- Protected app/auth routes stay excluded and noindexed.
- Sitemap can be submitted to Google Search Console and Bing Webmaster Tools.

## Privacy and Indexing Rules

Search engines and privacy controls are separate concerns.

### What Each Control Does

| Control | Use it for | Do not use it for |
|---------|------------|-------------------|
| Login/admin approval | Blocking product use. | Public-page SEO privacy by itself. |
| Cloudflare Access or Basic Auth | Blocking access to preview pages. | Public launch pages. |
| `<meta name="robots" content="noindex,nofollow">` | Telling crawlers not to index accessible pages. | Hiding truly private content from people. |
| `X-Robots-Tag` | Server-side noindex for paths before React runs. | Replacing auth for sensitive content. |
| `robots.txt` | Crawl guidance and crawl-budget control. | Keeping pages out of search results. |
| `sitemap.xml` | Discovery of approved public URLs. | Private route discovery. |

### Private Mode Rule

Private mode should satisfy all of these:

- `dist/sitemap.xml` has no `<url>` entries.
- `dist/robots.txt` includes `Disallow: /`.
- Initial HTML contains `noindex,nofollow`.
- `/garden`, `/admin`, `/login`, `/register`, email verification, resend verification, forgot password, and reset password paths receive `X-Robots-Tag: noindex, nofollow`.
- Marketing preview is available only in local dev or a protected preview environment.

### Why Robots Alone Is Not Enough

Google's own guidance says `robots.txt` is not a reliable way to keep a page out of Search. A URL blocked by robots can still be discovered and appear without a useful snippet. For pages that are accessible but should not be indexed, use `noindex`. For pages that should not be seen at all, use authentication or access control.

Practical rule: private equals access control plus noindex, not robots alone.

## Route Inventory

These routes are already represented in the marketing registry.

### Core Routes

| Route | Mode exposed | Indexing default | Funnel role |
|-------|--------------|------------------|-------------|
| `/` | Preview, teaser, launch | Teaser/launch only when indexing enabled | Primary Dr. Plant landing page. |
| `/waitlist` | Preview, teaser, launch | Teaser/launch only when indexing enabled | Invite request and social-hype intake. |
| `/plant-diagnosis-app` | Preview, launch | Launch only | High-intent app keyword page. |
| `/plant-care-app` | Preview, launch | Launch only | Broad plant care app page. |
| `/plant-watering-reminder-app` | Preview, launch | Launch only | Watering/reminder search intent. |
| `/houseplant-care-for-beginners` | Preview, launch | Launch only | Beginner education and trust page. |
| `/plant-problems` | Preview, launch | Launch only | Symptom hub. |
| `/plant-care-guides` | Preview, launch | Launch only | Species-guide hub. |

### Problem Guides

| Route | Search intent | CTA |
|-------|---------------|-----|
| `/plant-problems/yellow-leaves` | "why are my plant leaves yellow" | Diagnose this plant with Dr. Plant. |
| `/plant-problems/brown-tips` | "brown tips on plant leaves" | Diagnose this plant with Dr. Plant. |
| `/plant-problems/drooping-leaves` | "plant leaves drooping" | Diagnose this plant with Dr. Plant. |
| `/plant-problems/root-rot` | "root rot signs houseplant" | Diagnose this plant with Dr. Plant. |

### Species Guides

| Route | Search intent | CTA |
|-------|---------------|-----|
| `/plant-care-guides/pothos` | "pothos care for beginners" | Create a care schedule for this plant. |
| `/plant-care-guides/monstera` | "monstera care for beginners" | Create a care schedule for this plant. |
| `/plant-care-guides/snake-plant` | "snake plant care for beginners" | Create a care schedule for this plant. |
| `/plant-care-guides/peace-lily` | "peace lily care for beginners" | Create a care schedule for this plant. |
| `/plant-care-guides/spider-plant` | "spider plant care for beginners" | Create a care schedule for this plant. |
| `/plant-care-guides/philodendron` | "philodendron care for beginners" | Create a care schedule for this plant. |
| `/plant-care-guides/fiddle-leaf-fig` | "fiddle leaf fig care for beginners" | Create a care schedule for this plant. |
| `/plant-care-guides/aloe` | "aloe care for beginners" | Create a care schedule for this plant. |
| `/plant-care-guides/zz-plant` | "zz plant care for beginners" | Create a care schedule for this plant. |
| `/plant-care-guides/orchid` | "orchid care for beginners" | Create a care schedule for this plant. |

### Never Sitemap These Routes

Do not include these in `sitemap.xml`:

- `/garden`
- `/garden/*`
- `/admin`
- `/admin/*`
- `/login`
- `/register`
- `/verify-email/*`
- `/resend-verification`
- `/forgot-password`
- `/reset-password/*`
- API URLs
- Upload URLs
- User-generated image URLs
- Any shared plant page unless a future explicit public-sharing feature is designed and privacy-reviewed

## Page Briefs

Use these briefs when improving copy, adding content sections, commissioning visuals, or creating QA acceptance criteria.

### Landing Page: `/`

Primary job:

- Establish Dr. Plant as the product.
- Explain the beginner rescue moment.
- Route private/prelaunch users to request access.

Target audience:

- Houseplant beginners.
- People who are anxious about a sick plant.
- People who bought a plant and do not know what to do next.

Message:

```text
Dr. Plant helps beginner plant parents diagnose symptoms, build recovery plans, and keep houseplants on a calmer care routine.
```

Must include:

- H1: `Dr. Plant`
- Clear statement that this is private/prelaunch when in private mode.
- Product scene showing diagnosis, recovery plan, and care task.
- CTA to request access or start with first plant.
- Internal links to problem guides and care guides.
- SoftwareApplication JSON-LD in launch mode.

Avoid:

- Fake user counts.
- Fake ratings.
- "Instant cure" language.
- Generic "all-in-one plant app" copy without the Dr. Plant diagnosis angle.

### Waitlist Page: `/waitlist`

Primary job:

- Capture controlled teaser traffic.
- Explain that access is private and intentional.

Must include:

- Invite/private testing language.
- CTA to register or request access.
- Secondary CTA for existing users to sign in.
- UTM support for social profiles and campaigns.

Future improvement:

- Add a true waitlist form if registration should remain stricter than public account creation.
- Add referral tracking only after privacy and anti-spam rules are decided.

### Plant Diagnosis App: `/plant-diagnosis-app`

Primary job:

- Target high-intent searches from people with a current plant problem.

Must include:

- Symptoms, photo context, likely cause, and recovery-plan explanation.
- "Ask Dr. Plant" style CTA.
- Examples: yellow leaves, brown tips, droop, pests, root rot.
- Disclaimer that severe toxicity, pet ingestion, or chemical exposure needs qualified local help.

Internal links:

- `/plant-problems`
- `/plant-problems/yellow-leaves`
- `/plant-problems/root-rot`
- `/houseplant-care-for-beginners`

### Plant Care App: `/plant-care-app`

Primary job:

- Explain the product as a routine-building plant care app.

Must include:

- Add plant.
- Create care schedule.
- Track tasks.
- Ask Dr. Plant when symptoms appear.
- Keep journal/photos.

Internal links:

- `/plant-watering-reminder-app`
- `/plant-care-guides`
- `/plant-diagnosis-app`

### Plant Watering Reminder App: `/plant-watering-reminder-app`

Primary job:

- Capture "watering reminder" intent while differentiating from blind calendar reminders.

Must include:

- Watering reminders are care checkpoints, not automatic instructions.
- Emphasize overwatering prevention.
- Explain soil checks, pot drainage, and symptom-based follow-up.

Internal links:

- `/plant-problems/root-rot`
- `/plant-problems/yellow-leaves`
- `/houseplant-care-for-beginners`

### Beginner Guide: `/houseplant-care-for-beginners`

Primary job:

- Build trust with useful beginner education.

Must include:

- Light first.
- Water by condition.
- Drainage matters.
- Change one thing at a time.
- Use Dr. Plant when symptoms are confusing.

Future sections:

- "Your first week with a new plant"
- "How to tell if soil is dry"
- "When not to fertilize"
- "How to recover from overwatering"

### Problem Index: `/plant-problems`

Primary job:

- Help users choose the symptom they recognize.

Must include:

- Symptom cards.
- Short explanation of what Dr. Plant needs to know.
- Link to each problem guide.

Future sections:

- Visual symptom picker.
- "Not sure?" CTA into diagnosis flow.
- Seasonal/common issue modules.

### Problem Detail Template

Every problem page should answer:

- What the symptom usually means.
- What to check before taking action.
- What beginner-safe first steps are reasonable.
- What would make the issue urgent.
- What Dr. Plant can help track next.

Required page blocks:

- Symptom overview.
- Quick checks.
- Recovery steps.
- Mistakes to avoid.
- When to ask for help.
- CTA to diagnosis.

### Species Guide Template

Every species page should answer:

- What the plant generally likes.
- How to water it as a beginner.
- Light needs in plain language.
- Common beginner mistakes.
- Symptoms to watch.
- How Dr. Plant turns this into a schedule.

Required page blocks:

- Care rhythm.
- Beginner risks.
- Symptom links.
- CTA to create a care schedule.

## Content Quality Rules

Use these rules before any page becomes indexable.

### Helpful Content Checklist

Every page must have:

- A clear audience.
- A clear searcher problem.
- A clear next action.
- Original product-specific value.
- Internal links that help the user continue.
- Copy that is useful even if the user never signs up.
- Accurate title and meta description.
- Visible H1.
- Mobile-readable sections.
- No hidden keyword stuffing.
- No copied competitor language.

Every guide must avoid:

- Vague filler like "plants need care".
- Overconfident diagnosis from one symptom.
- Mass-produced AI paragraphs with no product tie-in.
- Repeating the same CTA after every paragraph.
- Claims that Dr. Plant can replace a botanist, vet, poison hotline, or local extension office.

### "Who, How, Why" Standard

Use this standard for content trust:

Who:

- Dr. Plant by Plant Care.
- Written for beginner houseplant owners.

How:

- Explain that guidance combines beginner plant-care practices, symptom context, and product workflows.
- If AI-assisted drafting is used, human review is required before indexing.

Why:

- Help plant owners make a safer next care decision.
- Route symptoms into recovery plans and reminders.
- Do not create pages only to capture keywords.

### Content Review Rubric

Score each page from 0 to 2.

| Area | 0 | 1 | 2 |
|------|---|---|---|
| Search intent | Unclear | Somewhat aligned | Directly answers the query |
| Product fit | Generic article | Light product mention | Product workflow improves the answer |
| Beginner clarity | Confusing | Mostly clear | Calm and plain language |
| Safety | Missing caveats | Some caveats | Clear limits and escalation notes |
| Internal links | None | Some links | Useful next-step links |
| CTA | Missing or vague | Present | Specific to page intent |
| Metadata | Missing/duplicated | Mostly complete | Unique, accurate, launch-ready |

Minimum launch score:

```text
12 / 14
```

Anything below that stays private.

## Traffic Funnel

The funnel is organized around rescue moments, not generic app discovery.

### Funnel Map

| Source | Landing page | User intent | Primary CTA | Activation event |
|--------|--------------|-------------|-------------|------------------|
| Google symptom query | Problem page | "What is wrong with my plant?" | Diagnose this plant | `first_dr_plant_message` |
| Google species query | Species guide | "How do I care for this plant?" | Create a care schedule | `first_plant_added` |
| TikTok/Reels/Shorts | Waitlist or symptom page | "This looks like my plant" | Request access | `waitlist_submit` or `signup_start` |
| Pinterest | Species guide or problem page | Save/check later | Create schedule or diagnose | `signup_start` |
| Reddit/community | Problem guide | Get a practical next step | Diagnose this plant | `first_dr_plant_message` |
| App store | App landing/product page | Try the app | Create account | `signup_complete` |
| Returning tester | `/login` | Use product | Complete care action | `first_task_completed` |

### Funnel Principles

- Problem pages should lead to Dr. Plant diagnosis.
- Species pages should lead to adding a plant or creating a schedule.
- Beginner education should lead to first plant setup.
- Social should usually lead to waitlist or a single symptom page.
- App-store traffic should lead directly to account creation or app install.

### UTM Naming

Use consistent UTM tags from day one.

Template:

```text
https://drplant.app/waitlist?utm_source={source}&utm_medium={medium}&utm_campaign={campaign}&utm_content={content}
```

Recommended values:

| Field | Examples |
|-------|----------|
| `utm_source` | `tiktok`, `instagram`, `youtube`, `pinterest`, `reddit`, `newsletter`, `app_store`, `google_play` |
| `utm_medium` | `social`, `short_video`, `pin`, `community`, `email`, `organic_app_store` |
| `utm_campaign` | `prelaunch_waitlist`, `yellow_leaves_series`, `beginner_houseplants`, `open_testing` |
| `utm_content` | `video_001_yellow_leaves`, `pin_pothos_care`, `carousel_root_rot` |

Example:

```text
https://drplant.app/waitlist?utm_source=tiktok&utm_medium=short_video&utm_campaign=prelaunch_waitlist&utm_content=video_001_yellow_leaves
```

## Analytics Plan

Private mode can track internal preview checks, but do not over-instrument before an analytics provider is chosen.

### Current Events

| Event | Meaning | Primary use |
|-------|---------|-------------|
| `page_view` | A route was viewed. | Page and source performance. |
| `marketing_cta_click` | A marketing CTA was clicked. | Funnel interest. |
| `waitlist_submit` | Waitlist/access CTA was used. | Teaser demand. |
| `signup_start` | Registration form submit started. | Signup intent. |
| `signup_complete` | Registration completed or reached gated state. | Account creation. |
| `first_plant_added` | User added first plant in this browser. | Activation. |
| `first_dr_plant_message` | User sent first successful Dr. Plant message in this browser. | Core feature activation. |
| `first_task_completed` | User completed first care task in this browser. | Habit formation. |

### Event Properties

Minimum useful properties:

| Event | Properties |
|-------|------------|
| `page_view` | `path`, `routeType`, `siteMode`, `indexable` |
| `marketing_cta_click` | `route`, `target`, `label`, `siteMode` |
| `waitlist_submit` | `route`, `target` |
| `signup_complete` | `requiresVerification`, `requiresAdminApproval` |
| `first_plant_added` | `speciesId` |
| `first_dr_plant_message` | `plantId` |
| `first_task_completed` | `source` |

### Provider Options

| Provider | Pros | Watch-outs |
|----------|------|------------|
| GA4 | Common, free, integrates with Search Console. | Heavier privacy/compliance overhead and noisier UI. |
| Plausible | Lightweight, privacy-focused, simple funnel reporting. | Paid hosted option or self-hosting. |
| PostHog | Product analytics, funnels, feature flags. | More setup and governance. |

Recommended near-term approach:

- Keep code-level events in place.
- Use a privacy-light provider when teaser mode begins.
- Do not add ad pixels until there is a real paid acquisition plan.

## Social and Hype Plan

The social goal before launch is not mass posting. It is asset creation, handle reservation, message testing, and controlled demand capture.

### Handle Targets

Try these in order:

- `DrPlantApp`
- `DrPlantCare`
- `AskDrPlant`
- `DrPlantHQ`

Platforms to reserve:

- TikTok
- Instagram
- YouTube
- Pinterest
- Threads
- X/Twitter, if useful later
- Reddit username, if community participation becomes intentional

### Content Pillars

| Pillar | Purpose | Example |
|--------|---------|---------|
| Symptom rescue | Capture anxious plant owners. | "Yellow leaves? Check these 3 things before watering again." |
| Beginner mistakes | Build trust and saves. | "Stop watering every Sunday. Check this instead." |
| Recovery stories | Show outcome and habit loop. | "Day 1 droop, day 7 rebound: what changed." |
| Product workflow | Show Dr. Plant naturally. | "I asked Dr. Plant what to do next." |
| Species basics | Evergreen search/social saves. | "Pothos care in 30 seconds." |

### Private Asset Bank Targets

Prepare before public posting:

- 30 short-form videos.
- 30 Pinterest pins.
- 10 carousel posts.
- 10 product screenshots.
- 5 plant rescue stories.
- 5 landing-page hero/social-image candidates.
- 3 app-store preview scripts.

### Short Video Template

Use this for TikTok, Reels, Shorts.

```text
Hook: "If your {plant} has {symptom}, do not {common mistake} yet."
Scene 1: Show the symptom close-up.
Scene 2: Show the full plant and pot/soil context.
Scene 3: Give 3 quick checks.
Scene 4: Show Dr. Plant turning symptoms into a recovery plan.
CTA: "Private testing is opening soon. Link in bio."
```

Example:

```text
Hook: "If your pothos has yellow leaves, do not just water it again."
Checks:
1. Feel soil two inches down.
2. Check if the pot drains.
3. Compare old leaves vs new growth.
CTA: "Dr. Plant turns this into a recovery plan."
```

### Pinterest Pin Template

```text
Title: "{Plant/Symptom}: Beginner Care Checklist"
Image: Plant photo or product screenshot plus 3 short checks.
Description: "A beginner-friendly checklist for {query}. Dr. Plant is private until launch, but this guide is ready for open testing."
Destination: Species guide, problem guide, or waitlist.
```

### Carousel Template

```text
Slide 1: Symptom hook
Slide 2: Common mistake
Slide 3: Check #1
Slide 4: Check #2
Slide 5: Check #3
Slide 6: What Dr. Plant tracks
Slide 7: CTA to waitlist or guide
```

### Posting Phases

| Phase | Site mode | Posting behavior | Goal |
|-------|-----------|------------------|------|
| Asset build | Private | No public posting required. | Build backlog and visual language. |
| Handle warmup | Private | Profile setup only, possibly no links. | Reserve brand and polish presence. |
| Teaser | Teaser, noindex | Link to `/waitlist`. | Measure interest without SEO launch. |
| Open testing | Teaser, maybe noindex | Publish more frequently, invite testers. | Validate activation and onboarding. |
| Launch | Launch | Publish guides and submit sitemap. | Search discovery and social conversion. |

## App Store SEO Prep

The app-store surface should be prepared before mobile launch even if store submission happens later.

### Apple App Store Draft

App name candidates:

- `Dr. Plant`
- `Dr. Plant Care`
- `Dr. Plant: Plant Care`

Subtitle candidates:

- `AI Plant Care Help`
- `Plant Diagnosis Guide`
- `Houseplant Care Help`

First sentence candidate:

```text
Dr. Plant helps beginner plant parents diagnose symptoms, build recovery plans, and keep houseplants on a calmer care routine.
```

Screenshot set:

| Slot | Screenshot | Message |
|------|------------|---------|
| 1 | Dr. Plant chat with symptom/photo context | Diagnose plant problems calmly. |
| 2 | Plant profile health tab | Keep each plant's health history in one place. |
| 3 | Recovery tasks | Turn advice into next steps. |
| 4 | Care schedule | Know what to do today. |
| 5 | Species guide | Learn care basics by plant. |
| 6 | Journal/photo comparison | Track progress over time. |

Keyword-field brainstorm:

```text
plant care,houseplants,plant doctor,plant diagnosis,watering reminder,plant health,pothos,monstera
```

Do not keyword-stuff visible copy. The app name, subtitle, first sentence, screenshots, and reviews matter more than awkward repetition.

### Google Play Draft

Short description candidate:

```text
Diagnose plant problems and build beginner-friendly houseplant care routines.
```

Feature graphic direction:

- Dr. Plant chat on one side.
- Plant recovery task on the other.
- Real product UI, not a generic leaf collage.
- Clear readable text at small sizes.

Screenshot set:

| Slot | Screenshot | Message |
|------|------------|---------|
| 1 | Dr. Plant diagnosis | Ask what is wrong with your plant. |
| 2 | Recovery plan | Follow beginner-safe next steps. |
| 3 | Care reminders | Keep up with watering and care. |
| 4 | Species setup | Start with your plant type. |
| 5 | Journal | Watch recovery over time. |

Video preview script:

```text
0-3s: "Yellow leaves? Do not guess."
3-8s: User adds symptom/photo.
8-14s: Dr. Plant organizes likely causes and checks.
14-22s: Recovery tasks appear.
22-30s: "Private testing now. Build calmer care routines."
```

## Search Console and Webmaster Setup

Do not submit the sitemap until launch mode is approved.

### Before Launch

Allowed:

- Create Google Search Console property.
- Verify domain ownership.
- Create Bing Webmaster Tools property.
- Confirm no sitemap has been submitted.
- Prepare launch annotations and benchmark reporting sheet.

Not allowed:

- Submit launch sitemap.
- Request indexing.
- Make SEO pages public and indexable.

### At Launch

Checklist:

- Build with `VITE_PUBLIC_SITE_MODE=launch`.
- Confirm sitemap contains approved marketing/content routes only.
- Confirm auth/protected paths remain excluded.
- Submit `https://drplant.app/sitemap.xml`.
- Inspect `/`, `/plant-diagnosis-app`, one problem page, and one species guide.
- Validate structured data using Google's Rich Results Test.
- Start weekly Search Console review.

### Weekly Search Review

Track:

- Indexed pages.
- Excluded pages.
- Queries.
- Clicks.
- Impressions.
- Average position.
- CTR.
- Pages with crawling/indexing problems.
- Unexpected indexed auth/private URLs.

If an auth/private URL appears:

1. Confirm `X-Robots-Tag`.
2. Confirm it is not in sitemap.
3. Confirm it has no public internal links.
4. Use Search Console removal only if urgent.
5. Fix root cause before requesting recrawl.

## QA and Verification

Run these from `C:\Source\Repos\PlantCare`.

### Web Tests

```powershell
npm.cmd run test -w @plant-care/web
```

Expected:

```text
Test Files passed
Tests passed
```

### Private Build Verification

```powershell
$env:VITE_PUBLIC_SITE_MODE = "private"
$env:VITE_MARKETING_INDEXABLE = "false"
npm.cmd run build -w @plant-care/web
Get-Content apps/web/dist/robots.txt
Get-Content apps/web/dist/sitemap.xml
Select-String -Path apps/web/dist/index.html -Pattern "noindex,nofollow"
```

Expected:

- `robots.txt` includes `Disallow: /`.
- `sitemap.xml` contains no `<url>` entries.
- `index.html` contains `noindex,nofollow`.

### Teaser Build Verification

```powershell
$env:VITE_PUBLIC_SITE_MODE = "teaser"
$env:VITE_MARKETING_INDEXABLE = "false"
npm.cmd run build -w @plant-care/web
Get-Content apps/web/dist/sitemap.xml
Select-String -Path apps/web/dist/index.html -Pattern "noindex,nofollow"
```

Expected:

- Sitemap remains empty.
- HTML remains noindex.
- `/` and `/waitlist` can render in the app.

Indexed teaser, only if approved:

```powershell
$env:VITE_PUBLIC_SITE_MODE = "teaser"
$env:VITE_MARKETING_INDEXABLE = "true"
npm.cmd run build -w @plant-care/web
Select-String -Path apps/web/dist/sitemap.xml -Pattern "<loc>"
```

Expected:

- Sitemap includes `/` and `/waitlist`.
- It should not include problem/species guide URLs.

### Launch Build Verification

```powershell
$env:VITE_PUBLIC_SITE_MODE = "launch"
Remove-Item Env:VITE_MARKETING_INDEXABLE -ErrorAction SilentlyContinue
npm.cmd run build -w @plant-care/web
Select-String -Path apps/web/dist/sitemap.xml -Pattern "/plant-diagnosis-app"
Select-String -Path apps/web/dist/sitemap.xml -Pattern "/plant-care-guides/pothos"
Select-String -Path apps/web/dist/sitemap.xml -Pattern "/garden"
Select-String -Path apps/web/dist/index.html -Pattern "index,follow"
```

Expected:

- Sitemap includes approved marketing routes.
- Sitemap does not include `/garden`.
- HTML contains `index,follow`.

### Protected Header Verification

After deploying behind nginx:

```powershell
Invoke-WebRequest -Uri "https://drplant.app/login" -Method Head -UseBasicParsing
Invoke-WebRequest -Uri "https://drplant.app/garden" -Method Head -UseBasicParsing
```

Expected:

```text
X-Robots-Tag: noindex, nofollow
```

If HEAD is not supported by the proxy, use GET and inspect headers.

### Visual QA

Check these viewports:

- 390 x 844 mobile
- 768 x 1024 tablet
- 1440 x 900 desktop

Pages to check:

- `/`
- `/waitlist`
- `/plant-diagnosis-app`
- `/plant-problems`
- `/plant-problems/yellow-leaves`
- `/plant-care-guides`
- `/plant-care-guides/pothos`

Look for:

- No overlapping text.
- CTA visible without hunting.
- Header usable on mobile.
- Cards do not nest awkwardly.
- Page text is not too large inside compact panels.
- Private preview notice appears only in private preview mode.
- No broken links.

### Known TypeScript Caveat

`npx.cmd tsc -p apps/web/tsconfig.json --noEmit` currently fails on existing repo-wide issues unrelated to this guide or the SEO implementation, including test matcher typings and pre-existing component prop/type mismatches. Use the web test suite and Vite build as the current verification baseline until the repo-wide type debt is cleaned up.

## Launch Gates

### Gate 1: Private Build Gate

Pass this gate before every production deploy while private.

- [ ] `VITE_PUBLIC_SITE_MODE=private`.
- [ ] `VITE_MARKETING_INDEXABLE=false`.
- [ ] Production build succeeds.
- [ ] Sitemap is empty.
- [ ] HTML is `noindex,nofollow`.
- [ ] Protected routes return `X-Robots-Tag`.
- [ ] No public Search Console sitemap submission.
- [ ] No public social link points to non-preview marketing pages.

Decision:

```text
Private deploy approved: yes/no
Approver:
Date:
Notes:
```

### Gate 2: Protected Preview Gate

Use this when reviewing marketing pages before public exposure.

- [ ] Preview hostname exists.
- [ ] Cloudflare Access or Basic Auth is enabled.
- [ ] Preview build uses `VITE_ENABLE_MARKETING_PREVIEW=true`.
- [ ] Preview build uses `VITE_MARKETING_INDEXABLE=false`.
- [ ] Preview pages render.
- [ ] Sitemap remains empty.
- [ ] Preview hostname is not used in public social profiles.

Decision:

```text
Protected marketing preview approved: yes/no
Approver:
Date:
Preview URL:
Notes:
```

### Gate 3: Teaser Gate

Use this when social accounts or a waitlist need a controlled public destination.

- [ ] Teaser decision is explicit.
- [ ] `VITE_PUBLIC_SITE_MODE=teaser`.
- [ ] Decide whether teaser is indexed. Default: no.
- [ ] `/` and `/waitlist` copy has been reviewed.
- [ ] UTM links are ready.
- [ ] Analytics provider is ready or intentionally deferred.
- [ ] Registration/access policy is clear.
- [ ] No problem/species guide is indexable.

Decision:

```text
Teaser approved: yes/no
Indexed teaser approved: yes/no
Approver:
Date:
Primary CTA:
Notes:
```

### Gate 4: Open Testing Gate

Use this when a larger tester group is allowed in.

- [ ] Admin approval flow can handle expected volume.
- [ ] Support inbox or contact route is monitored.
- [ ] Onboarding path is stable.
- [ ] First plant added flow is stable.
- [ ] Dr. Plant chat is stable with current OpenAI settings.
- [ ] Error messages are understandable.
- [ ] Analytics shows signup and activation events.
- [ ] Privacy policy has been reviewed for current data practices.

Decision:

```text
Open testing approved: yes/no
Approver:
Date:
Tester target count:
Support owner:
Notes:
```

### Gate 5: Public SEO Launch Gate

Use this when the marketing/content pages are intentionally public and indexable.

- [ ] Launch decision is explicit.
- [ ] `VITE_PUBLIC_SITE_MODE=launch`.
- [ ] `VITE_MARKETING_INDEXABLE=true` or unset.
- [ ] Sitemap includes only approved marketing/content URLs.
- [ ] Auth/protected routes remain noindex and excluded.
- [ ] Metadata unique for all launch pages.
- [ ] Structured data validates.
- [ ] Search Console verified.
- [ ] Bing Webmaster verified.
- [ ] Sitemap submitted.
- [ ] Social bios point to approved public route.
- [ ] Content review rubric score is 12/14 or higher for each indexed guide.

Decision:

```text
Public SEO launch approved: yes/no
Approver:
Date:
Submitted sitemap: yes/no
Notes:
```

## Risk Register

| Risk | Impact | Prevention | Response |
|------|--------|------------|----------|
| Private pages get indexed | Privacy and brand risk | Keep noindex, no sitemap entries, protected headers | Remove sitemap links, verify noindex, use Search Console removals if urgent |
| Launch mode enabled too early | Public pages go live before review | Require explicit launch gate | Rebuild private, redeploy, verify crawler files |
| Thin AI content published | Search quality and trust risk | Human review and content rubric | Deindex or rewrite weak pages |
| Claims overpromise diagnosis | User trust and safety risk | Use careful language and disclaimers | Rewrite page and support docs |
| Social posts create support surge | Operational burden | Teaser gating and admin approval | Pause posting, update waitlist language |
| App-store copy mismatches product | Rejection or low conversion | Keep screenshots and claims current | Update listing before submission |
| Analytics tracks too much too early | Privacy risk | Start with minimal funnel events | Audit provider settings |
| User-generated photos appear public | Severe privacy risk | Never sitemap uploads or user pages | Remove exposure immediately |

## Backlog After Launch

Do not do these until the first launch data exists.

### SEO Expansion

- Add more problem pages: fungus gnats, leaf curling, leaf spots, webbing, sticky leaves, mold on soil.
- Add more species pages: calathea, jade plant, rubber plant, hoya, basil, rosemary, tomato seedlings.
- Add comparison pages only if claims can be fair, factual, and maintained.
- Add glossary pages for terms beginners actually search.
- Add image SEO with original plant symptom photos.

### Product/Funnel Expansion

- Public share cards for non-sensitive plant recovery stories.
- Referral waitlist.
- Email onboarding sequence.
- Dr. Plant diagnosis starter prompts by symptom.
- Public symptom picker that routes into signup.

### Technical SEO Expansion

- SSR or static pre-rendering for marketing pages if search performance requires it.
- Dedicated OG images per page.
- Content freshness dates and review dates.
- XML image sitemap if original images become a serious traffic source.
- Automated sitemap diff check in CI.

### Analytics Expansion

- Activation cohorts.
- Search page to signup conversion.
- First Dr. Plant message to first recovery task conversion.
- Signup source to retained user conversion.
- App-store listing A/B tests when available.

## Source Links

Use these as the source-of-truth links when revisiting this guide.

Google Search:

- [Block Search indexing with noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
- [Robots.txt introduction](https://developers.google.com/search/docs/crawling-indexing/robots/intro)
- [Sitemaps overview](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)
- [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Software app structured data](https://developers.google.com/search/docs/appearance/structured-data/software-app)
- [Breadcrumb structured data](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb)
- [Article structured data](https://developers.google.com/search/docs/appearance/structured-data/article)
- [Search Console sitemap report](https://support.google.com/webmasters/answer/9128668)

App stores:

- [Apple App Store product page guidance](https://developer.apple.com/app-store/product-page/)
- [Google Play preview assets guidance](https://support.google.com/googleplay/android-developer/answer/9866151)

Competitor research references:

- [Planta](https://getplanta.com/)
- [PictureThis](https://www.picturethisai.com/)
- [PlantIn](https://myplantin.com/)

Social research:

- [TikTok Creative Center](https://ads.tiktok.com/creative/creativeCenter)
