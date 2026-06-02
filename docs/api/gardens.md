# Gardens API

> **Navigation:** [API INDEX](INDEX.md) · [Architecture: garden-centric model](../architecture/garden-model.md) · [ADR-0007](../architecture/decisions/0007-garden-centric-model.md)

**Controller:** `apps/api/src/gardens/gardens.controller.ts`
**Path prefix:** `/api/v1/gardens`
**Auth:** JWT required

Gardens are the **primary container** for plants — see
[architecture/garden-model.md](../architecture/garden-model.md). A plant belongs to a home
garden (`Plant.gardenId`); members of that garden help care for it.

## Concepts

| Concept | Model | Description |
|---------|-------|-------------|
| Garden | `Garden` | Named workspace ("Living Room Plants", "Mom's Garden") that contains plants |
| Growing environment | `Garden.location` | Temporary backing field constrained to `Indoor` or `Outdoor` while the garden environment model is being renamed |
| Member | `GardenMember` | Accepted user with role `OWNER` / `CAREGIVER` / `VIEWER` |
| Invite | `CareInvite` | Pending email/token invite (becomes a `GardenMember` on accept) |
| Home plant | `Plant.gardenId` | A plant's container garden |
| Share | `PlantShare` | Additive cross-garden plant share |
| Activity | `ActivityEvent` | Audit feed (created, invited, member removed, …) |

Access is enforced in `task-access.ts` + `garden-authz.ts`: creator, **home-garden member**,
or shared-into-garden member.

## Endpoints

| Method | Path | Body | Role | Description |
|--------|------|------|------|-------------|
| POST | `/gardens` | `CreateGardenDto` (name, location?) | — | Create garden; creator becomes OWNER |
| GET | `/gardens/mine` | — | member | Gardens for the user (members + shared plants) |
| GET | `/gardens/summaries` | — | member | **Landing cards**: per garden — plants, tasksDueToday, overdue, urgentAlerts, status, isOwner, memberCount |
| GET | `/gardens/:id` | — | view | **Garden Dashboard**: header, members, plants (next task + attention), taskSummary {dueToday, overdue, upcoming}, nextWatering, notesCount, tasks[] |
| GET | `/gardens/:id/invites` | — | owner | Pending (unaccepted, unexpired) invites |
| POST | `/gardens/:id/invites` | `CreateInviteDto` (email?, role) | owner | Invite a CAREGIVER/VIEWER; returns token (+ emailSent) |
| POST | `/gardens/invites/accept` | `AcceptInviteDto` (token) | — | Accept an invite; joins as a member |
| DELETE | `/gardens/:id/members/:memberUserId` | — | owner | Remove a member (the owner cannot be removed) |
| POST | `/gardens/:id/plants` | `SharePlantDto` | owner | Per-plant share into the garden (additive) |
| GET | `/gardens/:id/activity` | — | view | Activity feed |

`POST /gardens` accepts `name` plus an optional `location` value of `Indoor` or `Outdoor`
(`@IsIn(['Indoor','Outdoor'])`). The web UI labels this as **growing environment**, not
free-text location.

### Related: plant creation

`POST /plants` (`plants.controller.ts`) **requires `gardenId`** and 403s unless the user is an
OWNER/CAREGIVER of that garden. Generated tasks inherit `gardenId` from the plant.

## Web UI

| Surface | Route | File |
|---------|-------|------|
| My Gardens | `/garden/gardens` | `pages/gardens/MyGardens.tsx` |
| Garden Dashboard | `/garden/gardens/:id` | `pages/gardens/GardenDashboard.tsx` |
| Garden Tasks | `/garden/gardens/:id/tasks` | `pages/gardens/GardenTasks.tsx` |
| Garden Plants | `/garden/gardens/:id/plants` | `pages/gardens/GardenPlants.tsx` |
| Garden Members | `/garden/gardens/:id/members` | `pages/gardens/GardenMembers.tsx` |
| Per-plant sharing | `/garden/household` | `pages/Household.tsx` (additive `PlantShare`) |

Client: `gardensApi` in `apps/web/src/services/api.ts` (`create(name, environment)` posts
`{ name, location: environment }`).

## Related

- [architecture/garden-model.md](../architecture/garden-model.md)
- [database/models/collaboration-and-community.md](../database/models/collaboration-and-community.md)
- [user-guide/household.md](../user-guide/household.md)
