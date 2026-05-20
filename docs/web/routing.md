# Web routing

> **Navigation:** [Web INDEX](INDEX.md) · [Guide 07](../guides/07-web-application.md) · Source: `apps/web/src/App.tsx`

## Public routes

| Path | Component | Notes |
|------|-----------|-------|
| `/` | `Home` | Landing or redirect if authenticated |
| `/login` | `Login` | |
| `/register` | `Register` | |
| `/verify-email/:token` | `VerifyEmail` | |
| `/resend-verification` | `ResendVerification` | |
| `/forgot-password` | `ForgotPassword` | |
| `/reset-password/:token` | `ResetPassword` | |

## Protected `/garden/*`

`ProtectedRoute` → optional onboarding → `OnboardingGate` → `Layout`.

| Path | Component |
|------|-----------|
| `/garden/onboarding` | `OnboardingWizard` |
| `/garden` | `Dashboard` (index) |
| `/garden/calendar` | `Calendar` |
| `/garden/plants/browse` | `BrowsePlants` |
| `/garden/plants/browse/:speciesId` | `SpeciesBrowseDetail` |
| `/garden/plants/new` | `AddPlant` |
| `/garden/plants/:id` | `PlantProfileLayout` (tabs below) |
| `/garden/plants/:id/overview` | `PlantOverviewTab` |
| `/garden/plants/:id/care` | `PlantCareTab` |
| `/garden/plants/:id/tasks` | `PlantTasksTab` |
| `/garden/plants/:id/journal` | `PlantJournalTab` |
| `/garden/plants/:id/health` | `PlantHealthTab` |
| `/garden/plants/:id/diagnosis` | Redirect → `../health` |
| `/garden/tasks` | `Tasks` |
| `/garden/tasks/:filter` | `FilteredTasks` |
| `/garden/insights/score` | `GardenScoreInsights` |
| `/garden/household` | `Household` |
| `/garden/community` | `Community` |
| `/garden/settings` | `Settings` |
| `/garden/subscription` | `Subscription` |

## Fallback

| Path | Behavior |
|------|----------|
| `*` | Redirect to `/` |

## Guards

- **`ProtectedRoute`** — requires valid JWT.
- **`OnboardingGate`** — redirects to `/garden/onboarding` until onboarding completed or skipped.
