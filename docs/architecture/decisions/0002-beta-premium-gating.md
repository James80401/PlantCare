# ADR-0002 — Premium limits intentionally ungated in beta

> **Navigation:** [ADR INDEX](INDEX.md) · [Auth & security](../auth-and-security.md)

**Status:** Accepted · **Date:** 2026-05

## Context

The schema and shared package define free-tier limits (`FREE_PLANT_LIMIT`,
`FREE_IDENTIFY_MONTHLY_LIMIT`) and a `PremiumGuard`. During the private beta the goal
is adoption and feedback, not revenue, so the team wants every tester to have full
access without a payment wall.

Observations that look like bugs but are deliberate:

- `PremiumGuard.canActivate()` returns `true` unconditionally.
- `ALL_USERS_PREMIUM=true` makes `effectivePlanTier` resolve everyone to PREMIUM at
  JWT-validation time, without touching the DB.
- Stripe "demo mode" (no key configured) upgrades instantly with no payment.

## Decision

Leave premium enforcement **off** for the beta. Keep the limit constants, guard, and
`effectivePlanTier` plumbing in place so gating can be switched on later by flipping
config and wiring the guard — not by re-architecting.

## Consequences

- Free-tier code paths are effectively unreachable today; tests that assert "free
  user blocked" would not reflect runtime behavior while `ALL_USERS_PREMIUM=true`.
- Activating paid tiers later is a deliberate, reviewable change (the commit
  "Restore real premium account tiers" began this): turn off `ALL_USERS_PREMIUM`,
  enforce `PremiumGuard`, and check the identify/plant-count limits in the services.
- **Do not** "fix" the always-true guard or the unused limit constants as dead code —
  they are load-bearing for the planned monetization, not an oversight.
