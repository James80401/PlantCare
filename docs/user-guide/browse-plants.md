# Browse & discover plants

> **Navigation:** [User guide INDEX](INDEX.md) · [Guide 10](../guides/10-end-user-product-guide.md#browse--discover-species)

## What it is

Browse lets you explore the **species catalog** (320+ plants) before adding one to your garden. You can filter, sort, see **recommended** picks, and open a detail page with growing metadata (pests, hardiness, humidity, etc.).

## How to open it

From the garden area: **Browse plants** (route `/garden/plants/browse`).

## Features

| Feature | Description |
|---------|-------------|
| **Pagination** | Move through catalog pages |
| **Filters** | Beginner-friendly, pet-safe, light, edible, humidity, blooms, pollinator-friendly, and more |
| **Sort** | Name, watering cadence, easiest-first (difficulty) |
| **Recommended row** | Personalized suggestions on first page |
| **Species detail** | Full profile; **Add to garden** from detail |

## Adding from browse

1. Open a species detail page.
2. Tap add / continue to add-plant flow with species pre-selected.
3. Set nickname, room, indoor/outdoor, light, pot — tasks generate on save.

## Technical reference

- API: `GET /species/browse`, `GET /species/recommended`, `GET /species/:id`
- Web: `BrowsePlants.tsx`, `SpeciesBrowseDetail.tsx`
