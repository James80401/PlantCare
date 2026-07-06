# Household page

> **Navigation:** [Web pages INDEX](INDEX.md) - Route: `/garden/household`

**Source:** `apps/web/src/pages/Household.tsx`

## Purpose

Manage **Care Share** households: list gardens, create garden, send invites, share plants, view activity.

## Data sources

- `gardensApi.mine()` - list gardens with members and shares
- `gardensApi.create`, `createInvite`, `sharePlant`, `acceptInvite`, `activity`

## UX sections

- Garden list and create form
- Join invite with token.
- Invite by email or shareable token.
- Share plant picker with explicit caregiver/journal permission copy.
- Activity timeline

## Utilities

`apps/web/src/utils/household.ts` - `plantsSharedWithUser()` for dashboard shared filter.

## Related

- [user-guide/household.md](../../user-guide/household.md)
- [api/gardens.md](../../api/gardens.md)
