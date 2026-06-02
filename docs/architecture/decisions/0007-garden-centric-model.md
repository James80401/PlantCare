# ADR-0007 — Garden-centric model (plants belong to gardens)

> **Navigation:** [ADR INDEX](INDEX.md) · [Garden-centric model](../garden-model.md)

**Status:** Accepted · **Date:** 2026-06

## Context

The app was **plant-centered**: `Plant.userId` made plants a flat per-user list, and a
`Garden` was only an optional *sharing overlay* — you shared an already-owned plant into a
garden via the `PlantShare` join table. This doesn't match how people live: a couple moving
in together want a shared workspace of plants both can tend.

We wanted Gardens to be the **primary container** — every plant lives in a garden, tasks
roll up to the garden, and sharing means inviting people to the garden.

A large amount of infrastructure already existed and could be reused: the `gardens` module
already had create / invite / accept / activity, the `OWNER | CAREGIVER | VIEWER` role
model, and the `CareInvite` → `GardenMember` invite-accept flow.

## Decision

Invert ownership and build the layered navigation, in four reviewable phases.

1. **`Plant.gardenId` is the home garden** (required). `Task.gardenId` is denormalized for
   efficient garden-level task views. `Garden.location` was added as a temporary backing
   field for the garden's indoor/outdoor environment.
2. **Keep `PlantShare`** as an *additive* cross-garden share, not the primary container.
   Access = creator **or** home-garden member **or** shared-into-garden member.
3. **Reuse the existing invite/accept flow and roles** rather than restructuring
   `GardenMember`/`CareInvite`. `CareInvite` = pending, `GardenMember` = accepted.
4. **Beta reset, no backfill.** Since `gardenId` is required and the app is in private beta,
   the dev DB was reset and seeds updated to create a home garden. Production data migration
   is out of scope (no production users yet).
5. **Navigation = progressive summarization**: Landing → Garden → Plant → Detail, each level
   summarizing and drilling deeper.

## Consequences

- Plants are always contained in a garden; the Add Plant flow is garden-first (create a
  garden before the first plant). Garden membership is the sharing primitive.
- Two sharing concepts coexist (garden membership + per-plant `PlantShare`). This is a
  deliberate flexibility trade — most sharing is garden-level; `PlantShare` covers the
  cross-garden case. Authz checks both paths.
- `Task.gardenId` is denormalized, so a task's garden and its plant's garden must stay in
  sync. All task-creation paths set it from the plant; a plant never changes garden today,
  so they can't diverge. If plant-moves-between-gardens is ever added, backfill task
  `gardenId` at move time.
- Required `gardenId` means no plant can exist outside a garden — simpler invariants, but a
  one-time destructive migration for any existing data (acceptable in beta).
- Roles stay simple (Owner / Caretaker / Viewer). Finer-grained permissions can layer on
  later without changing the container model.
