# Onboarding wizard

> **Navigation:** [User guide INDEX](INDEX.md) · [Guide 10](../guides/10-end-user-product-guide.md#onboarding)

## What it is

The first time you enter the garden after registration, Plant Care may show a short **onboarding wizard** to learn your experience level and default growing conditions. This helps recommendations and copy feel relevant.

## How it works

1. After login you may be routed to `/garden/onboarding`.
2. Answer a few questions (e.g. beginner vs experienced, typical light).
3. **Finish** or **Skip** — skip still lets you use the app; you can adjust preferences later in settings.

Until onboarding is complete or skipped, the main layout (`OnboardingGate`) does not show the dashboard.

## After onboarding

You land on the **garden dashboard** and can add your first plant from the catalog or search.

## Technical reference

- API: `PUT /users/me/onboarding`
- Web: `OnboardingWizard.tsx`, `OnboardingGate.tsx`
- E2E: `tests/e2e/onboarding.spec.ts`
