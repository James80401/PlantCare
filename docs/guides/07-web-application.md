# Guide 07 — Web application

> **Navigation:** [Guides INDEX](INDEX.md) · [Web INDEX](../web/INDEX.md)

## Stack

- **React 19** + **TypeScript**
- **Vite 6** — dev server :5173, production build to `dist/`
- **React Router 6** — client-side routes
- **Tailwind CSS** — styling
- **date-fns** — dates in dashboard/tasks

Source root: `apps/web/src/`.

---

## Route tree (complete)

From `App.tsx`:

### Public

| Path | Page |
|------|------|
| `/` | `Home` (landing or redirect if logged in) |
| `/login` | `Login` |
| `/register` | `Register` |
| `/verify-email/:token` | `VerifyEmail` |
| `/resend-verification` | `ResendVerification` |
| `/forgot-password` | `ForgotPassword` |
| `/reset-password/:token` | `ResetPassword` |

### Protected `/garden/*`

Wrapped by `ProtectedRoute` → `Layout`. Approved signed-in users enter the garden directly.

| Path | Page |
|------|------|
| `/garden/onboarding` | Redirect → `/garden` |
| `/garden` | `Dashboard` |
| `/garden/calendar` | `Calendar` |
| `/garden/plants/browse` | `BrowsePlants` |
| `/garden/plants/browse/:speciesId` | `SpeciesBrowseDetail` |
| `/garden/plants/new` | `AddPlant` (+ wizard) |
| `/garden/plants/:id/overview` | `PlantOverviewTab` |
| `/garden/plants/:id/care` | `PlantCareTab` |
| `/garden/plants/:id/tasks` | `PlantTasksTab` |
| `/garden/plants/:id/journal` | `PlantJournalTab` |
| `/garden/plants/:id/health` | `PlantHealthTab` |
| `/garden/plants/:id/diagnosis` | Redirect → `health` |
| `/garden/tasks` | `Tasks` |
| `/garden/tasks/:filter` | `FilteredTasks` (today, overdue, …) |
| `/garden/insights/score` | `GardenScoreInsights` |
| `/garden/household` | `Household` |
| `/garden/community` | `Community` |
| `/garden/settings` | `Settings` |
| `/garden/subscription` | `Subscription` |

Canonical routing doc: [web/routing.md](../web/routing.md).

---

## Auth & session

1. Login/register stores `accessToken` (+ `refreshToken`) in `localStorage`.
2. `AuthContext` exposes `user`, `login`, `logout`.
3. `api.ts` attaches Bearer header; handles 401 → refresh or logout.
4. `ProtectedRoute` redirects anonymous users to `/login`.

Details: [web/state-and-api-client.md](../web/state-and-api-client.md).

---

## Dashboard

- Loads `GET /dashboard` via `useDashboard`.
- Tasks from `useTasksInRange` for interactions.
- Plants list + **household** shared filter (All / My / Shared).
- Schedule suggestions, weather panel, engagement widgets.

Doc: [web/pages/dashboard.md](../web/pages/dashboard.md).

---

## Plant profile (tabs)

| Tab | Focus |
|-----|--------|
| Overview | Photo, species, location, quick stats |
| Care | Care guide overview, environment |
| Tasks | Plant-scoped task list |
| Journal | Entries, photos, edit/delete |
| Health | Diagnosis form, Dr. Plant, history |

Doc: [web/pages/plant-profile.md](../web/pages/plant-profile.md).

---

## Species discovery

- **Browse** — filters, sort, pagination, recommended row.
- **Detail** — metadata panel (pests, zones, humidity).

Docs: [web/pages/browse-plants.md](../web/pages/browse-plants.md).

---

## Household & community

- **Household** — create garden, invite, share plants, activity.
- **Community** — post feed, create/delete posts.

Docs: [web/pages/household.md](../web/pages/household.md), [web/pages/community.md](../web/pages/community.md).

---

## Build & env

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | API prefix (required in prod Docker build) |

```bash
npm run build -w @plant-care/web
```

---

## Related

- [08 — UI components](08-ui-components-and-design.md)
- [12 — Mobile](12-mobile-and-client-packaging.md)
