# Collaboration & community models

> **Navigation:** [Database models INDEX](INDEX.md) · [Guide 04](../guides/04-data-model-and-persistence.md)

## Collaboration (Care Share)

### Garden

| Field | Notes |
|-------|-------|
| `id` | CUID |
| `name` | Display name |
| `createdAt` | |

Relations: `members`, `shares`, `invites`, `activityEvents`.

### GardenMember

| Field | Notes |
|-------|-------|
| `gardenId`, `userId` | Composite membership |
| `role` | e.g. owner / member |

### PlantShare

Links a **plant** into a **garden** so members can view (and task rules via services).

| Field | Notes |
|-------|-------|
| `plantId`, `gardenId` | |
| `sharedByUserId` | Who shared |

### CareInvite

Pending email invitation.

| Field | Notes |
|-------|-------|
| `token` | Accept token |
| `email` | Invitee |
| `gardenId` | |
| `expiresAt` | |

### ActivityEvent

Feed events: plant shared, task completed, etc.

| Field | Notes |
|-------|-------|
| `gardenId` | |
| `type` | Event kind |
| `payloadJson` | Details |

**API:** [api/gardens.md](../../api/gardens.md)  
**Authorization:** `apps/api/src/gardens/garden-authz.ts`, `apps/api/src/tasks/task-access.ts`

---

## Community

### CommunityPost

| Field | Notes |
|-------|-------|
| `userId` | Author |
| `body` | Text |
| `speciesId` | Optional link |
| `plantId` | Optional link |
| `imageUrl` | Optional |

### Comment (schema)

Exists for future threaded comments; not exposed in current REST API.

### PostLike (schema)

Exists for future likes; not exposed in current REST API.

**API:** [api/community.md](../../api/community.md)

---

## PlantSpecies relation

`PlantSpecies.communityPosts` — optional link from post to catalog species.

---

## Related

- [user-guide/household.md](../../user-guide/household.md)
- [user-guide/community.md](../../user-guide/community.md)
