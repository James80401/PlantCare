# Community page

> **Navigation:** [Web pages INDEX](INDEX.md) · Route: `/garden/community`

**Source:** `apps/web/src/pages/Community.tsx`

## Purpose

Display and create **community posts** — social feed inside the app.

## Data sources

- `communityApi.listPosts()`
- `communityApi.createPost()`
- `communityApi.deletePost(id)`

## UX

- Feed of cards (author, body, image, timestamp)
- Compose new post
- Delete own posts

## Navigation

Linked from desktop header **Community**; not always on mobile bottom nav (check `Layout.tsx`).

## Related

- [user-guide/community.md](../../user-guide/community.md)
- [api/community.md](../../api/community.md)
