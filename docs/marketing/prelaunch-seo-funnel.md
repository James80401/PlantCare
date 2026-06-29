# Dr. Plant Pre-Launch SEO and Funnel Runbook

Dr. Plant stays private until an explicit launch, teaser, open-testing, or social-hype decision. Build the public surface ahead of time, but keep indexing off by default.

## Site Modes

| Mode | Env | What visitors see | Search posture |
|------|-----|-------------------|----------------|
| Private | `VITE_PUBLIC_SITE_MODE=private` | Guests go to sign in. Marketing pages render only in dev or protected preview. | `noindex,nofollow`; empty sitemap; robots disallows crawling. |
| Teaser | `VITE_PUBLIC_SITE_MODE=teaser` | Landing and waitlist/access page can be exposed. | Not indexed unless `VITE_MARKETING_INDEXABLE=true`. |
| Launch | `VITE_PUBLIC_SITE_MODE=launch` | Approved marketing, problem, and species-guide pages are public. | Indexable by default; sitemap includes approved URLs. |

Recommended private preview setup:

```env
VITE_PUBLIC_SITE_MODE=private
VITE_ENABLE_MARKETING_PREVIEW=true
VITE_MARKETING_INDEXABLE=false
VITE_CANONICAL_BASE_URL=https://drplant.app
```

Use that only behind Cloudflare Access or Caddy Basic Auth on a preview host such as `preview.drplant.app`.

## Launch-Ready Pages

The app now has private-preview routes for:

- `/`
- `/waitlist`
- `/plant-diagnosis-app`
- `/plant-care-app`
- `/plant-watering-reminder-app`
- `/houseplant-care-for-beginners`
- `/plant-problems`
- `/plant-problems/yellow-leaves`
- `/plant-problems/brown-tips`
- `/plant-problems/drooping-leaves`
- `/plant-problems/root-rot`
- `/plant-care-guides`
- `/plant-care-guides/pothos`
- `/plant-care-guides/monstera`
- `/plant-care-guides/snake-plant`
- `/plant-care-guides/peace-lily`
- `/plant-care-guides/spider-plant`
- `/plant-care-guides/philodendron`
- `/plant-care-guides/fiddle-leaf-fig`
- `/plant-care-guides/aloe`
- `/plant-care-guides/zz-plant`
- `/plant-care-guides/orchid`

Protected and auth routes must never be placed in the sitemap: `/garden`, `/admin`, `/login`, `/register`, verification, resend, forgot password, and reset password paths.

## Traffic Funnel

| Source | First click | Primary action | Activation signal |
|--------|-------------|----------------|-------------------|
| Search problem query | Symptom page | Diagnose this plant | `first_dr_plant_message` |
| Search species query | Species guide | Create a care schedule | `first_plant_added` |
| Social short/video | Waitlist or symptom page | Request access | `waitlist_submit` or `signup_start` |
| App-store listing | App landing page | Create account | `signup_complete` |
| Returning private tester | Login | Complete plant care task | `first_task_completed` |

Current analytics events:

- `page_view`
- `marketing_cta_click`
- `waitlist_submit`
- `signup_start`
- `signup_complete`
- `first_plant_added`
- `first_dr_plant_message`
- `first_task_completed`

## Content and Social Bank

Prepare privately before any public posting:

- 30 short videos: symptom diagnosis, beginner care mistakes, before/after recovery, first plant setup.
- 30 Pinterest pins: symptom guides, watering mistakes, beginner species cheat sheets.
- 10 carousel posts: "why leaves turn yellow", "root rot first steps", "how to water by soil feel".
- 10 product screenshots: Dr. Plant chat, plant profile health tab, care tasks, species guide, calendar.
- 5 rescue stories: symptom, suspected cause, safe first step, follow-up task, visible improvement.

Use `DrPlantApp` or `DrPlantCare` consistently for handles when available. Use UTMs on every public profile link.

## App Store SEO Prep

Apple draft:

- App name: `Dr. Plant`
- Subtitle candidates: `AI Plant Care Help`, `Plant Diagnosis Guide`, `Houseplant Care Help`
- First sentence: `Dr. Plant helps beginner plant parents diagnose symptoms, build recovery plans, and keep houseplants on a calmer care routine.`

Google Play draft:

- Short description candidate: `Diagnose plant problems and build beginner-friendly houseplant care routines.`
- Feature graphic direction: Dr. Plant chat plus one plant recovery task, not a generic leaf pattern.

## Launch Gate Checklist

Private gate:

- [ ] Production build uses `VITE_PUBLIC_SITE_MODE=private`.
- [ ] `dist/sitemap.xml` contains no `<url>` entries.
- [ ] `dist/robots.txt` disallows `/`.
- [ ] Source HTML starts with `noindex,nofollow`.
- [ ] Auth/protected paths return `X-Robots-Tag: noindex, nofollow` through nginx.

Teaser gate:

- [ ] `VITE_PUBLIC_SITE_MODE=teaser`.
- [ ] `VITE_MARKETING_INDEXABLE=false` unless an indexed teaser is explicitly approved.
- [ ] Landing and waitlist routes are the only intended public routes.
- [ ] UTM links and `waitlist_submit`/`signup_start` events are visible in analytics.

Launch gate:

- [ ] `VITE_PUBLIC_SITE_MODE=launch`.
- [ ] `VITE_MARKETING_INDEXABLE=true` or unset.
- [ ] Sitemap contains only approved marketing/content URLs.
- [ ] Google Search Console and Bing Webmaster properties are verified.
- [ ] Rich Results validation passes for SoftwareApplication and Breadcrumb markup.
- [ ] Mobile and desktop marketing pages pass visual QA.
- [ ] Submit sitemap only after the public launch decision.
