# Gardens API (Household / Care Share)

> **Navigation:** [API INDEX](INDEX.md) · [Guide: Household](../guides/10-end-user-product-guide.md#household-shared-care)

**Controller:** `apps/api/src/gardens/gardens.controller.ts`  
**Path prefix:** `/api/v1/gardens`  
**Auth:** JWT required

## Concepts

| Concept | Model | Description |
|---------|-------|-------------|
| Garden | `Garden` | Named household (e.g. “Home”, “Office”) |
| Growing environment | `Garden.location` | Temporary backing field constrained to `Indoor` or `Outdoor` while the garden environment model is being renamed |
| Member | `GardenMember` | User with role in garden |
| Share | `PlantShare` | Owner shares a plant into garden |
| Invite | `CareInvite` | Email invite with accept token |
| Activity | `ActivityEvent` | Audit feed for shares and care events |

Shared plants appear on collaborators’ dashboards; task access is enforced in `task-access.ts` and `garden-authz`.

## Endpoints

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/gardens` | `CreateGardenDto` | Create garden; creator becomes member |
| GET | `/gardens/mine` | — | List gardens for current user with members/shares |
| POST | `/gardens/invites/accept` | `AcceptInviteDto` | Accept invite by token |
| POST | `/gardens/:id/invites` | `CreateInviteDto` | Invite email to garden |
| POST | `/gardens/:id/plants` | `SharePlantDto` | Share `plantId` into garden |
| GET | `/gardens/:id/activity` | — | Activity feed for garden |

## Web UI

`POST /gardens` accepts `name` plus an optional `location` value of `Indoor` or
`Outdoor`. The web UI labels this as growing environment, not free-text location.

- Page: `apps/web/src/pages/Household.tsx`
- Route: `/garden/household`
- Utils: `apps/web/src/utils/household.ts`

## Related

- [database/models/collaboration-and-community.md](../database/models/collaboration-and-community.md)
- [web/pages/household.md](../web/pages/household.md)
- [user-guide/household.md](../user-guide/household.md)
