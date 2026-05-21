# Plant Buddy — API Endpoints Reference

All endpoints are prefixed with `/buddy` and require JWT authentication via the existing `JwtAuthGuard`.

---

## Core Buddy

| Method | Endpoint | Description |
|---|---|---|
| POST | `/buddy` | Create buddy (onboarding — called once) |
| GET | `/buddy` | Get my buddy state |
| PATCH | `/buddy` | Update buddy (name, equipped items, terrarium) |
| GET | `/buddy/greeting` | Weather-flavored daily greeting message |

### POST /buddy

Request:
```json
{
  "name": "Monty",
  "speciesId": "monstera",
  "trait": "RESILIENT"
}
```

Response:
```json
{
  "id": "clx...",
  "name": "Monty",
  "speciesId": "monstera",
  "trait": "RESILIENT",
  "growthStage": "SEED",
  "journeyCount": 0,
  "dewdrops": 0,
  "sunlightToday": 0,
  "mood": "HAPPY",
  "streakDays": 0,
  "gardenCode": "SPROUT-7X4K",
  "equippedItems": {},
  "terrariumLayout": {},
  "unlockedSpecies": ["monstera"],
  "unlockedBiomes": ["seed_garden"]
}
```

### PATCH /buddy

Request (partial — only send fields to update):
```json
{
  "equippedItems": {
    "hat": "item_id_here",
    "potSkin": "item_id_here"
  },
  "terrariumBackground": "forest_floor_bg",
  "terrariumLayout": {
    "furniture": [
      { "itemId": "item_id", "x": 40, "y": 60 }
    ]
  }
}
```

---

## Journey

| Method | Endpoint | Description |
|---|---|---|
| GET | `/buddy/journey` | Get active journey (or null if none) |
| POST | `/buddy/journey/start` | Start a journey |
| POST | `/buddy/journey/respond` | Respond to discovery choice |
| GET | `/buddy/journey/history` | Past journeys (paginated) |

### POST /buddy/journey/start

Request:
```json
{
  "biomeId": "forest_floor"
}
```

Response:
```json
{
  "id": "clx...",
  "biomeId": "forest_floor",
  "startedAt": "2025-04-01T10:00:00Z",
  "endsAt": "2025-04-01T15:00:00Z",
  "completed": false,
  "estimatedMinutes": 300
}
```

### GET /buddy/journey (when complete)

Response:
```json
{
  "id": "clx...",
  "biomeId": "forest_floor",
  "completed": true,
  "completedAt": "2025-04-01T15:02:00Z",
  "dewdropsEarned": 30,
  "discovery": {
    "id": "ff_04",
    "narrative": "While exploring the mossy floor, Monty found a perfect circle of tiny mushrooms growing around an old stone.",
    "choiceA": "Monty looked closer at the mushroom ring.",
    "choiceB": "Monty gave the circle some space and moved on."
  },
  "itemDropped": null,
  "companionDropped": null
}
```

---

## Shop

| Method | Endpoint | Description |
|---|---|---|
| GET | `/buddy/shop/catalog` | Full catalog with ownership + availability |
| GET | `/buddy/shop/daily` | Today's 4 rotating items |
| POST | `/buddy/shop/purchase` | Purchase an item |
| GET | `/buddy/shop/inventory` | My owned items by category |

### POST /buddy/shop/purchase

Request:
```json
{
  "itemId": "item_id_here"
}
```

Response:
```json
{
  "success": true,
  "item": { "id": "...", "name": "Sun Hat", "category": "HAT" },
  "dewdropsSpent": 60,
  "dewdropsRemaining": 85
}
```

Error (insufficient funds):
```json
{
  "statusCode": 400,
  "message": "Insufficient dewdrops. Need 60, have 45."
}
```

---

## Quests

| Method | Endpoint | Description |
|---|---|---|
| GET | `/buddy/quests` | Active daily + achievement + monthly quests |
| GET | `/buddy/quests/daily` | Today's 3 daily quests only |
| GET | `/buddy/quests/achievements` | All achievements with progress |
| GET | `/buddy/quests/monthly` | Current monthly challenge progress |
| POST | `/buddy/quests/:id/claim` | Claim completed quest reward |

### GET /buddy/quests Response Shape

```json
{
  "daily": [
    {
      "questId": "daily_water",
      "title": "Water & Wonder",
      "description": "Complete a watering task today",
      "progress": 1,
      "required": 1,
      "completed": true,
      "rewardClaimed": false,
      "rewardDewdrops": 15
    }
  ],
  "achievements": [...],
  "monthly": {
    "title": "Spring Awakening",
    "stepsCompleted": 4,
    "totalSteps": 14,
    "nextStep": { "label": "Begin increasing watering frequency", "type": "TASK" }
  }
}
```

---

## Social / Garden Town

| Method | Endpoint | Description |
|---|---|---|
| GET | `/buddy/social/friends` | My friend list with buddy info |
| POST | `/buddy/social/friends/add` | Add friend by garden code |
| DELETE | `/buddy/social/friends/:friendBuddyId` | Remove a friend |
| POST | `/buddy/social/sunshine/:friendBuddyId` | Send sunshine |
| GET | `/buddy/social/sunshine/today` | Sunshine sent/received today |
| GET | `/buddy/social/friends/:friendBuddyId/terrarium` | View friend's terrarium |
| GET | `/buddy/social/feed` | Activity feed |

### GET /buddy/social/friends Response Shape

```json
[
  {
    "friendshipId": "clx...",
    "level": 3,
    "points": 22,
    "sunshineSentToday": false,
    "totalSunshineSent": 22,
    "friend": {
      "buddyId": "clx...",
      "name": "Orchi",
      "speciesId": "orchid",
      "growthStage": "SEEDLING",
      "mood": "HAPPY",
      "equippedItems": { "hat": "flower_crown" },
      "lastActiveLabel": "Active today"
    }
  }
]
```

### POST /buddy/social/sunshine/:friendBuddyId Response

```json
{
  "success": true,
  "dewdropsAwarded": 3,
  "friendshipPoints": 1,
  "newFriendshipLevel": null
}
```

If leveled up:
```json
{
  "success": true,
  "dewdropsAwarded": 3,
  "friendshipPoints": 1,
  "newFriendshipLevel": 4,
  "levelUpReward": 15
}
```

---

## Error Codes

| Code | Meaning |
|---|---|
| 400 | Bad request (invalid body, insufficient funds, bar not full) |
| 401 | Not authenticated |
| 403 | Premium required / biome not unlocked |
| 404 | Buddy not found (call POST /buddy first) |
| 409 | Conflict (journey already active, item already owned, friend already added) |
| 429 | Rate limited (sunshine already sent today) |
