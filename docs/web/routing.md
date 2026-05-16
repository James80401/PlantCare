# Web routing

> **Navigation:** [Web INDEX](INDEX.md) · Source: `apps/web/src/App.tsx`

| Path | Component | Auth |
|------|-----------|------|
| `/` | `Home` → Landing or redirect | Public |
| `/login` | `Login` | Public |
| `/register` | `Register` | Public |
| `/verify-email/:token` | `VerifyEmail` | Public |
| `/resend-verification` | `ResendVerification` | Public |
| `/forgot-password` | `ForgotPassword` | Public |
| `/reset-password/:token` | `ResetPassword` | Public |
| `/garden` | `Layout` → `Dashboard` | Protected |
| `/garden/plants/new` | `AddPlant` | Protected |
| `/garden/plants/:id` | `PlantProfile` | Protected |
| `/garden/tasks` | `Tasks` | Protected |
| `/garden/settings` | `Settings` | Protected |
| `/garden/subscription` | `Subscription` | Protected |

`ProtectedRoute` wraps `/garden/*`.
