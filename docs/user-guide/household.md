# Household (shared care)

> **Navigation:** [User guide INDEX](INDEX.md) · [Guide 10](../guides/10-end-user-product-guide.md#household-shared-care)

## What it is

**Household** lets multiple Dr. Plant users care for the same plants together. You create a shared **garden**, invite people by email, and **share** specific plants. Collaborators see shared plants on their dashboard and can complete care tasks according to access rules.

## How to open it

**Garden → Household** (or `/garden/household`).

## Typical workflow

1. **Create a household** — give it a name (e.g. “Our apartment”).
2. **Invite** someone — enter their email; they accept via invite link/token flow.
3. **Share a plant** — pick a plant you own and add it to the household.
4. **Activity** — see recent shares and care events.

## Dashboard filter

On the main garden page, use **All / My / Shared** to focus on plants you own vs plants shared with you. Shared plants show a **Shared** badge.

## Limits & privacy

- Only plants you explicitly share are visible to the household.
- Invites expire per server rules on `CareInvite`.
- You must be signed in; all actions use your account.

## Technical reference

- API: [api/gardens.md](../api/gardens.md)
- Data: [database/models/collaboration-and-community.md](../database/models/collaboration-and-community.md)
