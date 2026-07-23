# Garden-centric model

> **Navigation:** [Architecture INDEX](INDEX.md) · [API: gardens](../api/gardens.md) · [ADR-0007](decisions/0007-garden-centric-model.md) · [Auth & security](auth-and-security.md)

Dr. Plant is **garden-centered**: a Garden is the primary container and shared workspace
for plants. Every plant lives in a home Garden, care tasks roll up to the Garden, and
sharing happens by inviting people to the Garden. This replaced an earlier plant-centered
model where plants were a flat per-user list and gardens were only a sharing overlay.
See [ADR-0007](decisions/0007-garden-centric-model.md) for the why.

---

## Data model

```
User
 └── Garden (owns / is a member of)        Garden { name, environment, ownerId }
       ├── GardenMember (role)             OWNER · CAREGIVER · VIEWER
       ├── CareInvite (pending → accepted) token/email, expiresAt, acceptedAt
       ├── Plant (home garden)             Plant.gardenId  ← container
       │     ├── Task (Task.gardenId)      denormalized home garden
       │     ├── JournalEntry
       │     └── Diagnosis
       └── PlantShare (additive)           cross-garden plant sharing (kept)
```

Key fields (`prisma/schema.prisma` + `prisma/postgresql/schema.prisma`):

- **`Plant.gardenId`** (required) — the plant's **home garden**. `Plant.userId` stays as
  the creator/adder.
- **`Task.gardenId`** (nullable, denormalized) — the plant's home garden, so garden-level
  task views are a single indexed query (`@@index([gardenId, status])`).
- **`Garden.location`** — temporary backing field for growing environment. New gardens
  use `Indoor` or `Outdoor` only while the field is being renamed in the next data-model pass.
- **`GardenMember.role`** — `OWNER | CAREGIVER | VIEWER`. `CareInvite` holds *pending*
  invites; `GardenMember` holds *accepted* membership (the invite→accept split predates
  this refactor and is reused unchanged).
- **`PlantShare`** — retained as an **additive** mechanism: a plant can also be shared
  into *other* gardens, independent of its home garden.

## Authorization

Roles in [`garden-authz.ts`](../../apps/api/src/gardens/garden-authz.ts):

| Predicate | OWNER | CAREGIVER | VIEWER |
|-----------|:-----:|:---------:|:------:|
| `canViewGarden` | ✓ | ✓ | ✓ |
| `canEditGarden` (add plants, complete tasks) | ✓ | ✓ | — |
| `canManageGarden` (invite/remove, delete) | ✓ | — | — |

Plant/task access ([`task-access.ts`](../../apps/api/src/gardens/task-access.ts)) grants a
user access if **any** of:

1. they created the plant (`plant.userId`),
2. they are a member of the plant's **home garden** (`plant.garden.members`), or
3. they are a member of a garden the plant is **shared into** (`plant.shares[].garden`).

`canEditGarden` (OWNER/CAREGIVER) gates completing tasks for home-garden members;
`PlantShare.canComplete` gates shared-in members.

## Navigation hierarchy (progressive summarization)

```
Landing (Dashboard)        garden summary cards + "My Gardens" shortcut
   └── My Gardens          owned vs shared, GET /gardens/summaries
         └── Garden Dashboard      subsection cards + plants, GET /gardens/:id
               ├── Tasks            garden-scoped, overdue/today/upcoming
               ├── All Plants
               ├── Members          invite / roles / remove
               └── Plant Dashboard  Watering/Light/Fertilizer/Health/History cards
                     └── Detail      care / tasks / journal / health tabs
```

Each level shows a **summary** and drills deeper. The Plant Dashboard breadcrumb chains
`My Gardens › {Garden} › {Plant}` using the plant's home garden.

## API surface

See [api/gardens.md](../api/gardens.md) for full request/response detail.

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/gardens` | Create garden (name + Indoor/Outdoor environment); creator becomes OWNER |
| `GET` | `/gardens/mine` | Gardens for the user (members + shared plants) |
| `GET` | `/gardens/summaries` | Landing cards: plants, due today, overdue, alerts, status, isOwner |
| `GET` | `/gardens/:id` | Garden Dashboard detail: task buckets, next watering, notes, plants, tasks |
| `GET` | `/gardens/:id/invites` | Pending invites (owner) |
| `POST` | `/gardens/:id/invites` | Invite a caretaker/viewer (owner) |
| `POST` | `/gardens/invites/accept` | Accept an invite by token |
| `DELETE` | `/gardens/:id/members/:userId` | Remove a member (owner; not the owner) |
| `POST` | `/gardens/:id/plants` | Per-plant share into the garden (additive) |
| `GET` | `/gardens/:id/activity` | Activity feed |

Plant creation (`POST /plants`) **requires `gardenId`** and verifies the user is an
OWNER/CAREGIVER of that garden. All task-creation paths set `task.gardenId` to the plant's
home garden.

## Where it lives

- Backend: [`apps/api/src/gardens/`](../../apps/api/src/gardens/) (service, controller,
  authz, task-access); plant creation in
  [`plants.service.ts`](../../apps/api/src/plants/plants.service.ts).
- Frontend: [`apps/web/src/pages/gardens/`](../../apps/web/src/pages/gardens/) (MyGardens,
  GardenDashboard, GardenTasks, GardenPlants, GardenMembers),
  `components/gardens/` (GardenCard, CreateGardenForm), `hooks/useGardenDetail.ts`, and the
  Plant Dashboard in `pages/plant-profile/PlantProfileLayout.tsx`.

## Migration note

The shift made `Plant.gardenId` required. Per [ADR-0007](decisions/0007-garden-centric-model.md)
the beta DB was reset (`prisma db push --force-reset`) and seeds updated to create a home
garden — there is no production backfill. New installs are garden-first from the start.
