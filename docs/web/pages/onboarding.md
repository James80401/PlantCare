# Onboarding pages

> **Navigation:** [Web pages INDEX](INDEX.md)

## OnboardingWizard

**Route:** `/garden/onboarding` (outside main `Layout` until complete)  
**Source:** `apps/web/src/pages/OnboardingWizard.tsx`

Multi-step wizard collecting experience level and defaults; calls `PUT /users/me/onboarding`.

## OnboardingGate

**Source:** `apps/web/src/components/OnboardingGate.tsx`

Wrapper that redirects incomplete users to onboarding before showing `Layout` routes.

## Related

- [user-guide/onboarding.md](../../user-guide/onboarding.md)
- E2E: `tests/e2e/onboarding.spec.ts`
