# Dr. Plant Onboarding and Study Guide

> **Status:** living internal onboarding guide  
> **Last updated:** 2026-07-07  
> **Navigation:** [Product INDEX](INDEX.md) - [Roadmap](roadmap.md) - [End-user product guide](../guides/10-end-user-product-guide.md) - [Routes quick reference](../reference/routes-quick-reference.md)

This guide is the "start here, then study deeper" document for Dr. Plant. It is
written for a new teammate, tester, designer, support helper, or future version
of us who needs to understand what the application is, how the parts fit
together, what is already built, and where to look before making changes.

It covers the current product, current engineering shape, key user flows, data
model, APIs, operational posture, testing expectations, and product rules that
should not be broken accidentally.

## 1. Executive Summary

Dr. Plant is a private pre-launch plant-care application for houseplant
beginners and practical home growers. Its main promise is:

> Help a user understand what their plants need today, recover sick plants with
> Dr. Plant, and build a calm care history over time.

The product is more than a task list. It combines:

- A personal plant inventory grouped into gardens.
- Scheduled care tasks with task-type-aware feedback.
- Optional recommendations for non-critical guidance.
- Weather-aware advice.
- Per-plant journals and Plant Life progress check-ins.
- AI-assisted diagnosis, chat, recovery plans, and guided actions.
- A curated species catalog with hybrid long-tail identification.
- Care guides and plant problem intelligence.
- Community, household sharing, and Plant Buddy engagement layers.
- Private pre-launch marketing and SEO infrastructure.

The product direction is summary-first and drill-down-second. Users should see a
small number of useful summaries on broad pages, then choose the level of detail
they want:

```text
Dashboard -> Garden -> Plants -> Individual Plant -> Tabs and history
```

This matters. The app is intentionally moving away from overwhelming front-page
grids and long lists.

## 2. Brand and Product Identity

### Public brand

The public brand is **Dr. Plant**.

"Plant Care" may still appear in repository names, package names, old file
paths, historical docs, or internal technical identifiers. Those are not public
brand language. Product copy, user-facing UI, marketing pages, and launch assets
should say **Dr. Plant** unless a legacy technical package name is being
referenced directly.

### Primary audience

The primary launch audience is:

- Houseplant beginners.
- People trying to save a struggling plant.
- Users who want simple care routines without learning botany first.
- Owners of several indoor plants who want care tasks, reminders, and history.

### Positioning

Dr. Plant should compete with larger plant apps by focusing on the rescue moment:

```text
Symptom -> Dr. Plant diagnosis/chat -> recovery plan -> confirmed tasks/recommendations -> history
```

The product does not need to out-volume competitors with thin content. It should
win by being easier to use, clearer, safer, and more connected to the user's
actual plant history.

## 3. Current Launch Posture

Dr. Plant is hosted but private by default.

Important launch posture rules:

- Keep the main site private until explicit launch, open testing, or teaser
  approval.
- SEO-targeted pages should stay non-indexable while the product is private.
- App/auth/protected routes must remain excluded from public indexing.
- PWA install is acceptable during private hosting.
- Do not deploy to app stores until explicit full-release approval.
- Treat production URLs as stable:
  - Web: `https://drplant.app`
  - API: `https://api.drplant.app/api/v1`

Relevant docs:

- [Pre-launch SEO funnel plan](../marketing/prelaunch-seo-funnel.md).
- [Private online setup](../operations/private-online-setup.md).
- [Production sign-off](../operations/production-signoff.md).
- [Google Play closed testing](google-play-closed-testing.md).

## 4. Repository Map

The monorepo is organized around a React web app, NestJS API, shared package,
Prisma schema, docs, scripts, and deployment files.

```text
apps/
  api/                       NestJS API
  web/                       React + Vite frontend

packages/
  shared/                    Shared enums and helpers used by API/web

prisma/
  schema.prisma              SQLite dev schema
  postgresql/schema.prisma  Production/staging schema
  data/                      Species catalog and guide seed data
  migrations/                Database migrations
  seed.ts                    Seed script

docs/
  api/                       API behavior docs
  architecture/              Architecture and data-flow docs
  guides/                    Long-form guides
  operations/                Deploy, private hosting, sign-off
  product/                   Roadmap, trackers, QA, release plans
  reference/                 Quick references
  tutorials/                 Click-by-click tutorials
  user-guide/                User-facing feature docs
  web/                       Frontend routing/page notes

scripts/
  verify and deployment helpers
  species/photo validation scripts
  production sign-off tooling

docker-compose*.yml          Staging/production stack definitions
```

### Internal naming caution

The workspace and npm package names still use `plant-care` and
`@plant-care/*`. That is internal technical naming only. Do not reintroduce
"Plant Care" into public-facing UI or marketing copy.

## 5. Technology Stack

### Frontend

- React 19.
- Vite.
- TypeScript.
- Tailwind CSS.
- React Router.
- Axios API client in `apps/web/src/services/api.ts`.
- Component and page tests where practical.
- Capacitor/PWA packaging support.

### Backend

- NestJS.
- Prisma ORM.
- SQLite for local development.
- PostgreSQL schema for staging/production.
- JWT authentication with refresh tokens.
- File uploads for photos.
- Optional integrations for OpenAI, PlantNet, Stripe, email, push, and weather.

### Shared package

`packages/shared/src/index.ts` is the canonical shared source for:

- Plan tiers.
- Task types.
- Task statuses.
- Notification channels.
- Task type metadata.
- Free-tier limits.

When Vite/Rollup has trouble with built CommonJS output, the proven web fallback
is importing shared TypeScript source directly.

## 6. Product Mental Model

Dr. Plant uses a layered model:

1. **User** owns account, settings, preferences, plan tier, weather location,
   devices, AI usage, gardens, plants, and recommendations.
2. **Garden** is the main context container. A garden can be indoor/outdoor,
   owned or shared, and contains plants, members, tasks, and guidance.
3. **Plant** is the core entity. Each plant belongs to a garden and species,
   has tasks, journal entries, progress check-ins, diagnoses, chat
   conversations, milestones, and recommendations.
4. **Species** supplies default care knowledge, guide content, photos, and
   metadata.
5. **Task** is critical or scheduled care work the user should act on.
6. **Recommendation** is useful but non-critical guidance. It can be done,
   snoozed, dismissed, or converted to a task only when explicitly confirmed.
7. **Journal and Plant Life** preserve the story of the plant over time.
8. **Dr. Plant** reads the plant context and helps diagnose, explain, and draft
   follow-up actions.

The most important product distinction is:

```text
Tasks = care work that should be treated as scheduled/important.
Recommendations = helpful guidance that should not create urgency by default.
```

## 7. Roles and Permissions

### Anonymous visitor

Can access public routes such as landing/auth pages. In private mode, marketing
and SEO behavior should remain gated or noindex depending on the configured mode.

### Registered user

Can create/login to an account, but the production app may require email
verification and admin approval before entering the protected garden experience.

### Approved user

Can access the main `/garden` app, create gardens, add plants, complete tasks,
use Dr. Plant, journal, create Plant Life progress entries, use community,
manage settings, and use subscription/billing surfaces.

### Garden owner

Can manage garden membership and sharing, invite caregivers/viewers, add plants
to the garden, and remove or manage members depending on current UI/API rules.

### Shared garden member

Can see shared garden context. Permission details depend on member role and
plant sharing flags such as `canComplete` and `canJournal`.

### Admin

Can access admin registration and review tooling, including:

- Pending registration review.
- User list and account actions.
- Audit and observability views.
- External species review.
- Buddy admin tooling.
- AI unpause actions.

Admin routes are protected and should never be publicly indexed.

## 8. Web Route Map

The web app is rooted in `apps/web/src/App.tsx`.

### Public routes

Core public/auth routes:

- `/`
- `/login`
- `/register`
- `/verify-email/:token`
- `/resend-verification`
- `/forgot-password`
- `/reset-password/:token`
- `/privacy`
- `/terms`
- `/admin`
- `/admin/registrations`

Marketing routes may also exist for private/teaser/launch SEO work, such as
plant diagnosis, care app, watering reminders, beginner guides, plant problem
pages, and species guides.

### Protected app routes

Approved signed-in users enter the `/garden` area.

Main app routes:

- `/garden`
- `/garden/onboarding`
- `/garden/gardens`
- `/garden/gardens/:gardenId`
- `/garden/gardens/:gardenId/tasks`
- `/garden/gardens/:gardenId/care`
- `/garden/gardens/:gardenId/plants`
- `/garden/gardens/:gardenId/members`
- `/garden/calendar`
- `/garden/plants/browse`
- `/garden/plants/browse/:speciesId`
- `/garden/plants/new`
- `/garden/plants/:id`
- `/garden/plants/:id/overview`
- `/garden/plants/:id/care`
- `/garden/plants/:id/tasks`
- `/garden/plants/:id/journal`
- `/garden/plants/:id/health`
- `/garden/tasks`
- `/garden/tasks/:filter`
- `/garden/insights/score`
- `/garden/household`
- `/garden/community`
- `/garden/buddy`
- Buddy subroutes for activities, town, shop, quests, journeys, and friends.
- `/garden/settings`
- `/garden/subscription`

## 9. Authentication and Account Lifecycle

### Registration

Users register with email, password, and optional name. Depending on environment
configuration:

- Email verification may be required.
- Admin approval may be required.
- Account status may be `APPROVED`, `PENDING`, or `REJECTED`.

### Login and refresh

The frontend stores access and refresh tokens locally. The Axios client:

- Adds `Authorization: Bearer <token>` to protected requests.
- Avoids adding auth headers to public auth routes.
- Attempts refresh on `401` once.
- Clears local storage and redirects to login if refresh fails.

### Password reset and verification

Forgot/reset password and email verification routes are public auth routes and
should avoid auth refresh loops.

### Account deletion and export

Settings includes account actions. The API supports account deletion and data
export routes.

## 10. Dashboard Philosophy

The dashboard is the broadest daily entry point, not a place to show everything.

It should answer:

- What needs my attention today?
- Is anything overdue?
- What changed recently?
- Which garden should I open?
- Is there weather advice?
- Is Dr. Plant ready if I need help?

It should not show:

- Full plant grids for every garden.
- Long recommendation lists.
- Long per-plant weather advice lists by default.
- Raw data that belongs inside a garden or plant profile.

Current dashboard direction:

- Summary-first sections.
- Details hidden behind disclosure or drill-down.
- Plants are reached through gardens rather than shoved onto the home page.
- Recommendations and needs-attention guidance belong where they apply,
  especially in the specific garden view.
- Weather advice should summarize common guidance and only reveal per-plant
  details when requested.

## 11. Gardens

Gardens are the primary context layer between the broad dashboard and individual
plants.

### My Gardens

The gardens list is the user's starting map. It should show compact garden cards
with:

- Name.
- Indoor/outdoor context.
- Plant count.
- Member count.
- Due/overdue care status.
- Urgent alert count.

### Garden Dashboard

The garden detail page summarizes one garden and links to subsections.

Current sections include:

- All Plants.
- Tasks.
- Care Schedule.
- Notes.
- Members / Sharing.
- Needs attention.
- Recommendations.
- Plant cards for plants in that garden.

Needs attention and recommendations are intentionally shown inside the garden
context, not as giant global dashboard lists.

### Garden Recommendations

Garden recommendations are filtered to the current garden by:

- Matching `gardenId`.
- Matching a plant id that belongs to the garden.
- Matching an embedded recommendation plant that belongs to the garden.

### Garden Needs Attention

Needs-attention plants appear in a garden disclosure section. Each plant links
to:

- The plant profile.
- The plant's Dr. Plant Health tab.

### Garden Tasks

Garden tasks are garden-scoped task views. They should keep task row behavior
consistent with dashboard, global tasks, calendar, and plant profile tasks.

### Garden Members

Member management is used for household/shared care. Invites can be created and
accepted, with roles such as caregiver/viewer depending on current API support.

## 12. Plant Inventory

Plants are user-owned records tied to species and gardens.

A plant stores:

- Owner.
- Garden.
- Species.
- Nickname.
- Location.
- Pot size.
- Life stage.
- Approximate age.
- Date planted.
- Image URL.
- Notes.
- Tasks.
- Journal entries.
- Plant Life progress entries.
- Diagnoses.
- Dr. Plant conversations.
- Shares.
- Milestones.
- Recommendations.

### Add Plant Flow

The add plant flow supports:

- Selecting a species from the local catalog.
- Searching/browsing species.
- Setting nickname and environment details.
- Assigning the plant to a garden.
- Uploading/using an image.
- Photo identification.
- Confirming external long-tail species matches when needed.

When a plant is created, the backend generates care tasks from the plant,
species, garden, and schedule logic.

### Plant Profile

Every plant has a profile with tabs:

- **Overview:** identity, photo, environment, high-level care context.
- **Care:** species-specific and task-specific care guidance.
- **Tasks:** current and historical tasks for this plant.
- **Journal:** notes, photos, measurements, Plant Life check-ins, milestones.
- **Health:** diagnosis, Dr. Plant context, chat, recovery tasks.

The profile is the correct place for detailed plant-specific information.

## 13. Species Catalog

The species catalog is a curated local inventory plus user-confirmed external
species created through hybrid long-tail identification.

Current baseline from the intelligence tracker:

- 447 local species.
- 447 local, license-verified species photos (complete catalog coverage).
- 2 rows still need exact reusable photo sourcing/review.
- Catalog verifier enforces 400+ species.

Species store:

- Common name.
- Scientific name.
- Sunlight.
- Watering frequency.
- Toxicity.
- pH range.
- Care notes.
- Default image URL.
- Metadata JSON.
- Care guides.

### Browse and Search

Browse/search supports filters such as:

- Beginner-friendly.
- Pet-safe.
- Low light.
- Succulent.
- Edible.
- Drought tolerant.
- Indoor.
- Outdoor.
- High humidity.
- Pollinator friendly.
- Blooms indoors.

Recommended species can include human-readable match reasons such as easy care,
low-light tolerance, pet safety, indoor blooms, or pollinator value.

### Catalog Quality Rules

Do:

- Prefer fewer high-quality rows over many thin rows.
- Use verified photos with reusable licensing.
- Keep metadata useful to beginner decisions.
- Preserve source metadata for externally confirmed species.

Do not:

- Use nursery/blog images without permission.
- Substitute parent-species images for exact cultivars without a product
  decision.
- Treat external matches as curated before review.

## 14. Hybrid Long-Tail Identification

Hybrid long-tail identification lets the app handle plants that are not already
in the curated local catalog.

The pattern is:

1. User uploads a plant photo.
2. Identification provider returns candidate matches.
3. Local catalog matches can be used directly.
4. Unknown external matches remain provisional.
5. User explicitly confirms a match.
6. Confirmed external match creates a normal `PlantSpecies` row.
7. The new species stores provider, match id, confidence, confirmation time, and
   source metadata.
8. The admin review workflow can mark the species as reviewed or curated.

This avoids silently polluting curated catalog data while still letting users
add real plants beyond the initial inventory.

### External Species Review

Admin review supports:

- Filtering by user-confirmed, reviewed, and curated states.
- Editing common care fields.
- Reviewing source notes.
- Reviewing photo/license state.
- Adding review notes.

External species should not be treated as fully vetted until reviewed/curated.

## 15. Care Task System

Tasks are scheduled care actions. They represent work that should be surfaced
with enough urgency to act on.

### Canonical task types

The shipped canonical task types are:

| Task type | Label | Category | Meaning |
|-----------|-------|----------|---------|
| `WATER` | Water | Critical | Core watering care based on soil, plant needs, and schedule. |
| `FERTILIZE` | Fertilize | Routine | Nutrient care during active growth, with burn and dormancy safeguards. |
| `PRUNE` | Prune | Routine | Remove damaged growth, shape the plant, or encourage branching. |
| `MIST` | Mist / humidity | Routine | Humidity support when useful for the plant and environment. |
| `PH_TEST` | Test soil pH | Diagnostic | Check whether pH may affect nutrient availability. |
| `PEST_CONTROL` | Pest treatment | Critical | Treat likely or confirmed pest pressure and track follow-up signs. |
| `REPOT` | Repot | Seasonal | Move plant to a better pot or soil mix when roots/soil call for it. |
| `ROTATE` | Rotate | Routine | Turn plant for balanced light exposure and growth. |
| `CLEAN_LEAVES` | Clean leaves | Routine | Remove dust and make pests easier to spot. |
| `INSPECT_PESTS` | Inspect for pests | Diagnostic | Check leaves, stems, and soil surface for early pest signs. |
| `CHECK_MOISTURE` | Check moisture | Diagnostic | Check soil moisture before changing watering schedule. |
| `HEALTH_CHECK` | Health check | Diagnostic | Review symptoms, recovery, or overall plant status. |

The canonical source is `packages/shared/src/index.ts`.

### Deferred non-task ideas

Move/protect, harvest, and flush-soil are not active schema task types. They may
appear as recommendations or future product ideas, but should not be added as
tasks until scheduling behavior, guide coverage, feedback semantics, and Dr.
Plant context are defined.

### Task lifecycle

Task statuses:

- `PENDING`
- `DONE`
- `SKIPPED`

Task feedback records:

- Action.
- Reason.
- Optional note.
- Created time.

Supported task actions include:

- Complete.
- Bulk complete.
- Skip with reason/note.
- Snooze for 1, 3, or 7 days.
- View instructions.
- View schedule explanation.

### Scheduling

Scheduling uses species defaults, plant metadata, task type, weather, diagnosis
follow-up, and recommendation conversion. Watering intervals are especially
important because they drive the daily care loop.

### Task UX Principle

Task rows should behave consistently across:

- Dashboard.
- Calendar.
- Global tasks.
- Filtered tasks.
- Garden tasks.
- Plant profile tasks.

Users should not need to relearn what complete, skip, snooze, or instructions
mean on each page.

## 16. Recommendations

Recommendations are durable, optional guidance. They are not the same as care
tasks.

Recommendation statuses:

- `ACTIVE`
- `DONE`
- `SNOOZED`
- `DISMISSED`

Recommendation priorities:

- `LOW`
- `MEDIUM`
- `HIGH`

Recommendation sources:

- `DR_PLANT`
- `PLANT_CHECK_IN`
- `CARE_TIMING`
- `ENVIRONMENT`
- `SEASONAL`
- `SYSTEM`

### Why recommendations exist

Some guidance is useful but not urgent:

- Plant Check-In prompts.
- Heat or weather checks.
- Move/protect suggestions.
- Flush-soil guidance.
- Harvest guidance.
- Dr. Plant suggested follow-up that does not need to become a task yet.

### Recommendation actions

Users can:

- Mark done.
- Snooze until tomorrow.
- Dismiss.
- Convert to task if a task-backed action is available.

Conversion to task must be explicit. Dr. Plant should not silently create tasks.

### Placement rule

Recommendations should appear where they apply:

- Garden-level recommendations in the garden view.
- Plant-level recommendations in plant/garden context.
- Global dashboard only when summary-level context is genuinely useful.

## 17. Weather Advice

Weather advice uses the user's saved location and cached forecast data.

Weather features include:

- Location search.
- Weather advice status.
- Fetching today's advice.
- Cached daily advice.
- Rain skip guidance for outdoor watering.
- Heat, frost, and rain summaries.
- Per-plant weather advice when details are requested.

### Weather UX Principle

Weather advice must avoid repeating the same message for every plant by default.

Good default:

```text
It will be hot today and may rain. Watch sun exposure and fast-drying pots, but
outdoor watering may not be needed if rain arrives. Open details for per-plant
notes.
```

Bad default:

```text
31 plant cards, 29 of which repeat the same heat warning.
```

The broad dashboard should show summarized weather. Per-plant details should be
hidden behind expansion or placed in the relevant garden/plant context.

## 18. Journal and Plant Life

The Journal tab is now both a traditional note/photo journal and a Plant Life
history surface.

### Journal entries

Journal entries can store:

- Notes.
- Photo.
- Height.
- Width.
- Leaf count.
- Created/updated time.

Users can create, edit, and delete journal entries.

### Plant Life progress entries

Plant Life progress check-ins are structured status reports for a plant.

The form captures:

- Overall health:
  - `THRIVING`
  - `STABLE`
  - `CONCERNED`
  - `DECLINING`
- Growth change:
  - `NEW_GROWTH`
  - `SAME`
  - `LEAF_LOSS`
  - `STRETCHING`
  - `FLOWERING`
  - `NOT_SURE`
- Leaf condition:
  - `HEALTHY`
  - `YELLOWING`
  - `BROWN_TIPS`
  - `SPOTS`
  - `DROOPING`
  - `WILTING`
  - `PEST_DAMAGE`
  - `NOT_SURE`
- Soil moisture:
  - `DRY`
  - `SLIGHTLY_DRY`
  - `MOIST`
  - `WET`
  - `NOT_CHECKED`
- Pest signs:
  - `NONE`
  - `POSSIBLE`
  - `VISIBLE_PESTS`
  - `WEBBING`
  - `STICKY_RESIDUE`
  - `NOT_CHECKED`
- Recent care:
  - `WATERED`
  - `FERTILIZED`
  - `REPOTTED`
  - `PRUNED`
  - `MOVED_LIGHT`
  - `PEST_TREATED`
  - `NO_CHANGE`
  - `MULTIPLE`
- Optional notes.
- Optional photo.
- Optional task linkage.

### AI progress story

When a progress check-in is submitted, the API packages:

- Current check-in fields.
- Optional photo context.
- Previous progress summaries and dates.
- Plant identity and care context.

Dr. Plant returns:

- A short progress story.
- Whether advice is needed.
- Advice text when useful.
- Trend:
  - `improving`
  - `stable`
  - `watch`
  - `declining`
- Suggested next check-in interval.
- Short flags.

The app stores the returned summary and uses it in the Plant Life history.

### Plant Life milestones

Milestones persist for events such as:

- Baseline check-in.
- Three check-ins.
- Progress photos.
- New growth.
- Stable streaks.
- Recovery signals.

### Health-check task handoff

Pending `HEALTH_CHECK` tasks can deep-link into the Plant Life check-in flow.
When a progress check-in is completed, matching Plant Check-In recommendations
can be completed.

## 19. Diagnosis and Dr. Plant

Each plant has its own Dr. Plant chat on the Health tab.

Entry points:

- Plant card Ask Dr. Plant.
- Plant profile header Ask Dr. Plant.
- Health tab Dr. Plant section.
- Care guide cards with "Ask Dr. Plant about this" handoffs.

Canonical path helper:

```text
apps/web/src/pages/plant-profile/constants.ts
plantDrPlantPath(plantId)
```

### One-shot diagnosis

The Health tab supports a diagnosis form with:

- Optional image.
- Symptom text.
- Symptom duration.
- Recent care change.
- Pest visibility.

The backend can produce:

- Result label.
- Confidence.
- Advice.
- Source.
- Structured `detailJson`.
- Versioned treatment plan.
- Matched plant problems.
- Recovery window.
- Follow-up task suggestions.

### Dr. Plant context transparency

The Health tab can show "What Dr. Plant sees." Context categories include:

- Care baseline.
- Health/open diagnosis.
- Upcoming tasks.
- Recent task feedback.
- Journal.
- Weather.

This is intentionally user-facing context, not raw prompts or secrets.

### Dr. Plant chat

The chat API supports:

- Listing conversations.
- Creating a conversation.
- Fetching a conversation.
- Sending messages.
- Uploading an image with a message.
- Guided context questions.
- Saving assistant replies to journal.
- Scheduling health checks.
- Getting recovery suggestions.
- Applying recovery tasks.
- Drafting recommendation/task action cards.
- Confirming recommendation drafts.
- Confirming task drafts.

Upload caution:

- Chat uploads use `FormData`.
- The web client must not force a fixed `Content-Type`; the multipart boundary
  must be set automatically.

### Dr. Plant action safety

Dr. Plant may draft actions, but durable changes require explicit user
confirmation.

Allowed with confirmation:

- Create recommendation.
- Create task.
- Save journal note.
- Schedule health check.
- Apply recovery tasks.

Not allowed:

- Silently creating tasks from assistant text.
- Making medical/chemical/pet-safety claims beyond supported plant guidance.
- Hiding the fact that advice is based on available context and may need user
  observation.

## 20. Plant Problem and Treatment Intelligence

The intelligence system includes:

- Curated plant problem library.
- Care archetypes.
- Treatment plan builder.
- Recovery suggestion mapper.
- Diagnosis result UI.
- Guide links from treatment plans.
- Care-card Dr. Plant handoffs.

### Beginner rescue focus

Priority plant problems include common beginner rescue moments such as:

- Yellow leaves.
- Brown tips.
- Drooping leaves.
- Root rot.
- Pest pressure.
- Overwatering.
- Underwatering.
- Light stress.
- Fertilizer burn.
- Temperature stress.

### Treatment plan expectations

Treatment plans should be:

- Ordered.
- Specific.
- Beginner-safe.
- Linked to likely causes.
- Honest about uncertainty.
- Clear about immediate actions vs monitoring.
- Connected to tasks/recommendations only when useful.

### Safety copy

Extra care is required around:

- Toxic plants.
- Edible plants.
- Pesticides.
- Severe decline.
- Pet/child exposure.
- Claims that sound like guaranteed cures.

## 21. Care Guides

Care guides are structured content tied to task types and optionally species.

Care guide records store:

- Task type.
- Optional species.
- Title.
- Summary.
- Structured sections JSON.
- Images.

Guide intelligence upgrades include:

- Rescue playbook sections.
- Common mistakes.
- Warning signs.
- Category-specific caveats.
- Ask Dr. Plant with context prompts.
- Troubleshooting cards on plant profile Care overviews.
- Contextual diagnosis guide links.
- Guide analytics for treatment-plan links and care-card handoffs.

### Guide content rules

Guides should:

- Be useful to beginners.
- Avoid filler.
- Explain why the care step matters.
- Mention signs to pause or adjust.
- Link to Dr. Plant when a user's plant-specific context matters.
- Avoid mass-generated, thin SEO content.

## 22. Dashboard, Garden, and Plant Drill-Down Pattern

This is a key UX rule.

Broad surfaces should summarize:

- Dashboard: whole account/day.
- Garden: one garden.
- Plant profile: one plant.

Detailed surfaces should expand:

- Garden plants page.
- Garden tasks page.
- Plant tabs.
- Health chat.
- Journal history.
- Care guide details.

Use disclosure patterns for:

- Repeated advice.
- Recommendation details.
- Needs-attention details.
- Weather per-plant details.
- Long timelines.
- Secondary insights.

Do not put every list on the first screen.

## 23. Plant Buddy

Plant Buddy is a secondary engagement lane that should support the core care
experience without crowding it.

Buddy features include:

- Buddy creation.
- Species/trait selection.
- Buddy state.
- Level and XP.
- Sunlight/dewdrops/bloom token currencies.
- Daily shop and inventory.
- Equipped items.
- Terrarium layout/background.
- Companion line.
- Greeting.
- Seasonal events.
- Journeys.
- Activities.
- Quests/challenges.
- Garden town/social Buddy features.
- Admin Buddy controls.

### Buddy product tone

Buddy should be warm, plant-grounded, and non-punishing.

Avoid guilt-driven copy such as implying the user neglected a character. Use
gentle language:

```text
Whenever you have a moment, a care task will help your plants and perk up your
buddy.
```

Buddy quality work is a separate lane from core plant care quality.

## 24. Community

Community supports social plant sharing.

Current concepts include:

- Posts.
- Images.
- Species links.
- Comments.
- Likes.
- Reposts/original post references.
- Follows.
- Blocks.
- Reports.
- Delete own posts.

Community should not become the main care workflow. It is supportive and social,
while the garden/plant/task/health loops remain primary.

## 25. Household and Shared Care

Household/shared care lets users collaborate.

Concepts include:

- Owned gardens.
- Garden members.
- Invites.
- Plant sharing.
- Caregiver/viewer roles.
- Per-plant share flags such as completing tasks or journaling.
- Garden activity.

Important UX rule:

Shared care should make responsibility clearer, not more confusing. When a task
or journal entry is shared, the UI should explain whose plant/garden it belongs
to.

## 26. Settings

Settings includes account and care preferences.

User settings fields include:

- Name/email identity.
- Plan tier.
- Weather coordinates and location label.
- Timezone.
- Temperature unit.
- Push/email/SMS notification preferences.
- Phone.
- Quiet hours.
- Reminder hour.
- Experience level.
- Default light level.

Settings also supports:

- Weather location search.
- Weather advice status.
- Data export.
- Account deletion.

## 27. Billing and Plan Limits

The app has free and premium concepts.

Shared constants include:

- Free plant limit: 5.
- Free identify monthly limit: 3.
- Free diagnosis monthly limit: 5.
- Free diagnosis chat monthly limit: 10.

Billing supports:

- Checkout.
- Status.
- Customer portal.
- Stripe webhooks.

Some MVP gating may be relaxed by environment flags such as all-users-premium
behavior. Always verify environment behavior before documenting a hard
production paywall.

## 28. Notifications and Devices

Notification concepts include:

- Push.
- Email.
- SMS.
- Device tokens.
- Notification logs.
- Quiet hours.
- Reminder hour.
- Weather/task/engagement notification hooks.

Mobile push and store preflight scripts exist, but app-store deployment remains
parked until launch approval.

## 29. Admin and Operations

Admin is used to safely operate the private pre-launch app.

Admin capabilities include:

- Pending registration review.
- User list.
- Approve/reject/disable users.
- Unpause AI for a user.
- Audit summary/logs.
- Observability.
- External species review.
- Buddy admin overview.
- Set Buddy level.
- Unlock/lock Buddy items.

Admin actions should be audited where appropriate.

## 30. SEO and Marketing Infrastructure

Dr. Plant has pre-launch SEO and funnel planning, but the site remains private
until explicit approval.

The desired public-site modes are:

- `private`
- `teaser`
- `launch`

Configuration concepts:

- `VITE_PUBLIC_SITE_MODE=private|teaser|launch`
- `VITE_CANONICAL_BASE_URL=https://drplant.app`
- `VITE_MARKETING_INDEXABLE=false|true`

SEO route metadata should include:

- Title.
- Description.
- Canonical.
- Robots.
- Open Graph.
- Twitter card.
- Structured data.
- Sitemap inclusion rules.

Protected app routes must always remain noindex/excluded.

Pre-launch traffic work should prepare assets and infrastructure, not leak the
private product into search prematurely.

## 31. API Overview

API base:

```text
/api/v1
```

Important API groups:

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/verify-email/:token`
- `POST /auth/resend-verification`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

### Users

- `GET /users/me`
- `PUT /users/me/care-preferences`
- `PUT /users/me/notification-settings`
- `GET /users/me/export`
- `DELETE /users/me`
- Weather location/advice routes under `/users/me/weather/*`

### Gardens

- `POST /gardens`
- `GET /gardens/mine`
- `GET /gardens/summaries`
- `GET /gardens/:id`
- `POST /gardens/:id/invites`
- `GET /gardens/:id/invites`
- `DELETE /gardens/:id/members/:memberUserId`
- `POST /gardens/invites/accept`
- `POST /gardens/:id/plants`
- `GET /gardens/:id/activity`

### Plants

- `GET /plants`
- `POST /plants`
- `GET /plants/:id`
- `PATCH /plants/:id`
- `DELETE /plants/:id`
- `GET /plants/:id/timeline`
- `POST /plants/identify`
- `POST /plants/identify/confirm-external`
- `POST /plants/upload`

### Species

- `GET /species/search`
- `GET /species/browse`
- `GET /species/recommended`
- `GET /species/:id`

### Tasks

- `GET /tasks`
- `PATCH /tasks/:id/complete`
- `PATCH /tasks/bulk/complete`
- `PATCH /tasks/:id/skip`
- `PATCH /tasks/:id/snooze`
- `GET /tasks/:id/instructions`
- `GET /tasks/:id/explanation`
- `GET /tasks/schedule-suggestions`
- `POST /tasks/schedule-suggestions/:id/apply`

### Recommendations

- `GET /recommendations`
- `GET /recommendations?plantId=...`
- `PATCH /recommendations/:id/done`
- `PATCH /recommendations/:id/snooze`
- `PATCH /recommendations/:id/dismiss`
- `POST /recommendations/:id/task`

### Journal

- `GET /plants/:plantId/journal`
- `POST /plants/:plantId/journal`
- `PATCH /plants/:plantId/journal/:entryId`
- `DELETE /plants/:plantId/journal/:entryId`

### Plant Progress

- `GET /plants/:plantId/progress`
- `POST /plants/:plantId/progress`
- `PATCH /plants/:plantId/progress/:entryId`
- `DELETE /plants/:plantId/progress/:entryId`

### Diagnosis

- `GET /plants/:plantId/diagnose/context`
- `POST /plants/:plantId/diagnose`
- `PATCH /plants/:plantId/diagnose/:diagnosisId`
- `GET /plants/:plantId/diagnose/:diagnosisId/recovery-suggestions`
- `POST /plants/:plantId/diagnose/:diagnosisId/recovery-tasks`
- `POST /plants/:plantId/diagnose/:diagnosisId/follow-up-task`

### Dr. Plant Chat

- `GET /plants/:plantId/diagnose/conversations`
- `POST /plants/:plantId/diagnose/conversations`
- `GET /plants/:plantId/diagnose/conversations/:conversationId`
- `GET /plants/:plantId/diagnose/conversations/:conversationId/actions/context-questions`
- `POST /plants/:plantId/diagnose/conversations/:conversationId/messages`
- `POST /plants/:plantId/diagnose/conversations/:conversationId/actions/journal-note`
- `POST /plants/:plantId/diagnose/conversations/:conversationId/actions/health-check`
- `POST /plants/:plantId/diagnose/conversations/:conversationId/actions/recovery-suggestions`
- `POST /plants/:plantId/diagnose/conversations/:conversationId/actions/recovery-tasks`
- `POST /plants/:plantId/diagnose/conversations/:conversationId/actions/drafts`
- `POST /plants/:plantId/diagnose/conversations/:conversationId/actions/recommendation-draft`
- `POST /plants/:plantId/diagnose/conversations/:conversationId/actions/task-draft`

### Billing and Devices

- `POST /billing/checkout`
- `GET /billing/status`
- `POST /billing/portal`
- `POST /billing/webhook`
- `POST /devices`
- `DELETE /devices`

### Admin

- `/admin/registrations/*`
- `/admin/audit/*`
- `/admin/observability`
- `/admin/species/external`
- `/admin/species/external/:speciesId/review`
- `/admin/buddy/*`

## 32. Data Model Overview

Core models:

- `User`
- `RefreshToken`
- `AdminAuditLog`
- `AiUsageEvent`
- `WeatherAdviceCache`
- `Subscription`
- `PlantSpecies`
- `CareGuide`
- `CareGuideImage`
- `Plant`
- `PlantMilestone`
- `Task`
- `TaskFeedback`
- `Recommendation`
- `JournalEntry`
- `PlantProgressEntry`
- `Diagnosis`
- `DiagnosisConversation`
- `DiagnosisMessage`
- `Garden`
- `GardenMember`
- `PlantShare`
- Community/social models.
- Notification/device models.
- Buddy models.

### Important model relationships

- User owns plants, gardens, recommendations, progress entries, device tokens,
  notification logs, AI usage, Buddy, milestones, and community data.
- Garden owns plants and can have members.
- Plant belongs to user, garden, and species.
- Plant has tasks, journal entries, progress entries, diagnoses, conversations,
  milestones, shares, and recommendations.
- Task belongs to plant and optionally garden/diagnosis.
- Recommendation belongs to user and optionally plant/garden.
- Diagnosis belongs to plant and may link follow-up tasks.
- PlantProgressEntry belongs to plant/user and can link to a task.

## 33. Integrations

### OpenAI

Used for Dr. Plant diagnosis/chat/progress analysis when configured. The API
needs `OPENAI_API_KEY`.

AI use should be logged or gated where appropriate, and fallbacks should exist
for private testing or unavailable providers.

### PlantNet or demo identification

Used for photo identification. Unknown matches can become confirmed external
species only after user confirmation.

### Weather provider

Used for forecast and advice. Weather advice is cached to avoid unnecessary
repeat fetches.

### Stripe

Used for subscription checkout, billing status, portal, and webhooks.

### Email

Used for verification, password reset, and optionally notifications.

### Push/mobile

Device tokens and push preflight exist; app-store release is deferred.

## 34. Analytics and Events

Analytics are most useful in teaser/launch mode and private QA when explicitly
needed.

Important event classes include:

- Page view.
- CTA click.
- Waitlist submit.
- Signup start.
- Signup complete.
- First plant added.
- First Dr. Plant message.
- First task completed.
- Recommendation view.
- Recommendation done.
- Recommendation snooze.
- Recommendation dismiss.
- Recommendation task conversion.
- Guide link click.
- Care-card Dr. Plant click.
- Buddy created.
- Buddy journey started.
- Buddy shop purchase.

Analytics should answer product questions, not create noise.

## 35. Accessibility and UX Rules

General rules:

- Use semantic headings and landmarks.
- Keep focus states visible.
- Announce errors and important async statuses.
- Avoid long lists on broad pages.
- Use summary/disclosure for secondary details.
- Keep button labels action-oriented.
- Keep task/recommendation urgency distinct.
- Avoid guilt copy.
- Preserve mobile readability.
- Avoid horizontal overflow.
- Keep form errors near fields.
- Use meaningful alt text for informative images.
- Empty states should tell the user what to do next.

### Section density rule

If a section can contain more than a handful of items, default to:

1. A summary line.
2. A count.
3. An expand/drill-down action.
4. The full list only after the user asks.

## 36. Testing and Verification

Common commands:

```powershell
npm run verify
npm run verify:docs
npm run build
npm run test
npm run uat:e2e
npm run species:verify
npm run species:photos:verify
npm run production:signoff -- --live-only
```

Use the lightest meaningful verification for the change:

- Docs only: `npm run verify:docs`.
- Shared enum/metadata change: build and relevant API/web tests.
- API behavior: API tests and `npm run verify`.
- User-facing UI: web tests and build.
- Species/catalog: species verifier and relevant photo scripts.
- Production/runtime change: build, deploy, and production sign-off.

## 37. Deployment and Sync Workflow

When finishing PlantCare work:

1. Stage changes.
2. Commit with a concise reason-focused message.
3. Push the current branch to `origin`.
4. Merge into `main` and push `main` unless explicitly told to stay on a
   feature branch.
5. For meaningful runtime changes, deploy/update the private hosted site and run
   sign-off.

Docs-only changes normally do not require a running-site deploy unless the docs
are part of the hosted product or the user explicitly asks for live deployment.

## 38. Current Roadmap Orientation

The canonical roadmap is [roadmap.md](roadmap.md). The current implementation
plan is [current-feature-implementation-plan.md](current-feature-implementation-plan.md).

Current direction:

1. Finish and polish existing shipped systems.
2. Keep recommendation systems decision-backed.
3. Improve core UX and accessibility.
4. Deepen plant intelligence/catalog quality.
5. Leave final performance and SEO lock-in until the app is closer to release
   complete.

Major shipped intelligence work:

- Problem library.
- Care archetypes.
- Treatment plan engine.
- Recovery task upgrade.
- Diagnosis UX upgrade.
- Catalog expansion to 447 species.
- Hybrid long-tail identification.
- Guide intelligence upgrade.
- Plant Life progress polish.

Known remaining/future areas:

- Maintain complete, license-verified local photo coverage when the catalog
  changes (447/447 verified as of 2026-07-23).
- Optional guide UX polish based on analytics.
- Bulk external-species review actions only if review volume justifies them.
- Broader Buddy integration tests and mobile layout pass.
- Final release performance optimization.
- Final SEO/indexing lock-in at launch.

## 39. Product Guardrails

Do not break these:

- Dr. Plant is the public brand.
- Keep the app private until launch/open-testing approval.
- Do not push app-store release without explicit approval.
- Do not let Dr. Plant silently create tasks.
- Keep tasks and recommendations distinct.
- Keep broad pages summary-first.
- Do not add fake catalog volume.
- Do not use unlicensed plant photos.
- Keep protected/auth/admin pages noindex.
- Do not expose prompt internals or API secrets.
- Use beginner-safe diagnosis and treatment language.
- Treat toxic/edible/pesticide advice carefully.
- Preserve garden context for recommendations and needs-attention guidance.

## 40. Study Tracks

### New product teammate track

Read in order:

1. This guide.
2. [Roadmap](roadmap.md).
3. [Current feature implementation plan](current-feature-implementation-plan.md).
4. [Plant intelligence expansion tracker](plant-intelligence-expansion.md).
5. [End-user product guide](../guides/10-end-user-product-guide.md).
6. [UAT checklist](uat-checklist.md).

Practice:

- Add a plant.
- Complete, skip, and snooze tasks.
- Submit a Plant Life check-in.
- Ask Dr. Plant a follow-up question.
- Open a garden and inspect recommendations.
- Browse species and compare match reasons.

### New engineer track

Read in order:

1. This guide.
2. [Application overview](../application-overview.md).
3. [Web routing](../web/routing.md).
4. [Routes quick reference](../reference/routes-quick-reference.md).
5. `apps/web/src/services/api.ts`.
6. `packages/shared/src/index.ts`.
7. `prisma/schema.prisma`.
8. The API module for the area being changed.

Practice:

- Trace a task from Prisma model to API controller to web `TaskRow`.
- Trace a recommendation from generator to API to garden UI.
- Trace a Dr. Plant chat upload from web FormData to controller.
- Trace a Plant Life check-in from form to AI summary and timeline.

### QA/tester track

Read in order:

1. This guide.
2. [Tester 5-minute smoke script](tester-5-minute.md).
3. [UAT checklist](uat-checklist.md).
4. [Mobile viewport QA](mobile-viewport-qa.md).
5. [Accessibility checklist](a11y-checklist.md).

Practice:

- Test empty account.
- Test account with one garden and one plant.
- Test account with many plants in one garden.
- Test weather advice with repeated per-plant advice.
- Test mobile width for dashboard, garden, plant profile, Health, Journal.
- Test keyboard access for task completion and Dr. Plant chat.

### Support/onboarding helper track

Read in order:

1. This guide.
2. [End-user product guide](../guides/10-end-user-product-guide.md).
3. User guide docs under `docs/user-guide/`.
4. Tutorials under `docs/tutorials/`.

Practice:

- Explain task vs recommendation in one sentence.
- Explain where to find a plant's Dr. Plant chat.
- Explain how to submit a Plant Life check-in.
- Explain why the dashboard does not show every plant.
- Explain how weather advice should be used.

## 41. Practical End-to-End Walkthroughs

### Walkthrough A: First plant

1. Register and get approved.
2. Open `/garden`.
3. Create or select a garden.
4. Add plant.
5. Search species or identify by photo.
6. Confirm external species if the match is outside the local catalog.
7. Set nickname, garden, location, pot size, life stage.
8. Save plant.
9. Review generated tasks.
10. Open plant profile.
11. Review Care tab.
12. Add a journal note or progress check-in.

### Walkthrough B: Daily care

1. Open dashboard.
2. Review due/overdue summary.
3. Open the relevant garden.
4. Expand recommendations only if desired.
5. Open tasks.
6. Complete, skip, or snooze tasks.
7. Add optional task feedback.
8. Open plant profile if more context is needed.

### Walkthrough C: Sick plant rescue

1. Open the plant profile.
2. Go to Health.
3. Review "What Dr. Plant sees."
4. Submit symptoms/photo for one-shot diagnosis.
5. Review treatment plan and recovery window.
6. Start or continue Dr. Plant chat.
7. Answer guided context questions if offered.
8. Confirm suggested tasks or recommendations only when useful.
9. Add a Plant Life check-in after treatment.
10. Mark diagnosis resolved when appropriate.

### Walkthrough D: Progress story

1. Open plant profile.
2. Go to Journal.
3. Submit Plant Life check-in.
4. Add optional photo.
5. Review AI progress story.
6. Check trend strip and milestones.
7. Edit entry if details were wrong.
8. Confirm story recomputes after meaningful edits.

### Walkthrough E: Shared care

1. Create garden.
2. Invite member.
3. Share plant or garden context.
4. Confirm member sees the correct shared items.
5. Confirm task/journal permissions behave as expected.
6. Review garden activity.

## 42. Glossary

**Care archetype:** A practical category used to adapt guidance for plant types
such as tropical foliage, drought-tolerant, edible, flowering, high-humidity, or
general plants.

**Care guide:** Structured task/species guidance shown in the Care tab or guide
surfaces.

**Diagnosis:** One-shot Dr. Plant analysis for a plant symptom/photo.

**Dr. Plant:** The app's plant-health assistant and public brand.

**Garden:** A group/context for plants, tasks, members, and guidance.

**Hybrid identification:** Identification flow that uses local catalog matches
when available and provisional external matches when needed.

**Plant Life:** The structured progress/history layer for each plant.

**Progress check-in:** A Plant Life form submission with health/growth/soil/pest
status, optional photo, and AI summary.

**Recommendation:** Optional durable guidance that is useful but not critical by
default.

**Task:** Scheduled care work such as watering, fertilizing, pruning, pest
treatment, or health check.

**Treatment plan:** Structured recovery guidance generated from diagnosis,
problem library, species/care archetype, and symptom context.

## 43. Where to Look Before Changing an Area

| Area | Start here |
|------|------------|
| Brand/copy | This guide, roadmap, relevant UI component |
| Dashboard | `apps/web/src/pages/Dashboard.tsx`, `apps/api/src/dashboard/` |
| Gardens | `apps/web/src/pages/gardens/`, `apps/api/src/gardens/` |
| Plants | `apps/web/src/pages/plant-profile/`, `apps/api/src/plants/` |
| Tasks | `apps/web/src/components/tasks/TaskRow.tsx`, `apps/api/src/tasks/`, `packages/shared/src/index.ts` |
| Recommendations | `apps/web/src/components/recommendations/`, `apps/api/src/recommendations/` |
| Plant Life | `apps/web/src/pages/plant-profile/PlantJournalTab.tsx`, `apps/api/src/progress/` |
| Dr. Plant | `apps/web/src/components/DrPlantChat*`, `apps/api/src/diagnosis/` |
| Species | `apps/web/src/pages/BrowsePlants*`, `apps/api/src/species/`, `prisma/data/species-catalog.ts` |
| Care guides | `apps/api/src/care-guides/`, `prisma/data/care-guide-templates.ts` |
| Weather | `apps/api/src/weather/`, dashboard weather UI |
| Buddy | `apps/web/src/pages/buddy/`, `apps/api/src/buddy/` |
| Community | `apps/web/src/pages/Community*`, `apps/api/src/community/` |
| Auth/admin | `apps/api/src/auth/`, `apps/api/src/admin/`, auth pages |
| Billing | `apps/api/src/billing/`, subscription page |
| SEO/marketing | marketing route/meta registry and pre-launch SEO docs |
| Deploy/signoff | `docs/operations/`, `scripts/deploy-on-server.sh`, `scripts/production-signoff.mjs` |

## 44. Final Orientation

When deciding what to build next, ask:

1. Does this help a beginner care for or rescue a real plant?
2. Does this belong on the broad dashboard, inside a garden, or on a plant?
3. Is it a task, recommendation, journal entry, diagnosis, or guide?
4. Does Dr. Plant need context transparency or explicit confirmation here?
5. Will this make the app calmer or more overwhelming?
6. Can we verify it with a focused test or QA path?
7. Does it preserve private pre-launch posture?

If the answer makes the app calmer, clearer, and more useful for real plant
care, it probably belongs in Dr. Plant.
