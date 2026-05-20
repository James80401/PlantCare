# Community API

> **Navigation:** [API INDEX](INDEX.md) · [Guide: Community](../guides/10-end-user-product-guide.md#community)

**Controller:** `apps/api/src/community/community.controller.ts`  
**Path prefix:** `/api/v1/community`  
**Auth:** JWT required

## Purpose

Public-style **feed of posts** inside the app: growers share tips, photos, or species references.

**Note:** Prisma models `Comment` and `PostLike` exist; current API exposes **posts only** (no comment/like endpoints yet).

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/community/posts?limit=` | List recent posts (newest first) |
| POST | `/community/posts` | Create post (body, optional `speciesId`, `plantId`, `imageUrl`) |
| DELETE | `/community/posts/:id` | Delete own post |

## Post shape (typical)

- `id`, `body`, `imageUrl`
- `author` (user summary)
- Optional `species` / `plant` relation
- `createdAt`

## Web UI

- Page: `apps/web/src/pages/Community.tsx`
- Route: `/garden/community`
- Nav: desktop header link

## Related

- [database/models/collaboration-and-community.md](../database/models/collaboration-and-community.md)
- [web/pages/community.md](../web/pages/community.md)
- [user-guide/community.md](../user-guide/community.md)
