# Community page

> **Navigation:** [Web pages INDEX](INDEX.md) - Route: `/garden/community`

**Source:** `apps/web/src/pages/Community.tsx`

## Purpose

Display and create **community posts** - the social feed inside the app.

## Data sources

- `communityApi.listPosts({ limit, cursor })` - paginated `{ posts, nextCursor, hasMore }`
- `communityApi.createPost()`
- `communityApi.deletePost(id)`

## UX

- Feed of cards with author, body, optional image, timestamp, likes, and comments.
- Compose a practical plant-care post with optional species tag and optional photo.
- Delete own posts and comments after confirmation.
- Empty feed and loading states explain what to do next.

## Navigation

Linked from desktop header **Community**; not always on mobile bottom nav (check `Layout.tsx`).

## Related

- [user-guide/community.md](../../user-guide/community.md)
- [api/community.md](../../api/community.md)
