# Plant Buddy — Social & Garden Town

## Philosophy

Garden Town is the social layer of Plant Buddy. It is **purely supportive** — there are no leaderboards, no rankings, no competition. Users can visit friends' terrariums, see their buddy's growth stage, and send "Sunshine" (good vibes). The system is designed to feel like a neighborhood of gardens, not a competition.

---

## Friend Connections

### Adding Friends

Friends are connected via a **Garden Code** — a unique 8-character alphanumeric code assigned to each user on buddy creation.

```
Format: SPROUT-XXXX
Example: SPROUT-7X4K
```

To add a friend:
1. Share your Garden Code with someone
2. They enter it in Garden Town > Add Friend
3. Connection is **mutual and immediate** — both users see each other

### Garden Code Generation

```typescript
function generateGardenCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  let code = 'SPROUT-';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code; // e.g. SPROUT-7X4K
}
```

---

## Sunshine System

Sunshine is a daily goodwill action. You can send sunshine to each friend once per day.

### Sending Sunshine
- Tap the "☀️ Shine" button on any friend's card in Garden Town
- Both users receive +3 Dewdrops immediately
- The button shows "Sent ✓" for the rest of the day
- Resets at midnight local time

### Sunshine Notifications
- Friend receives a push notification: "{Your name}'s buddy sent you sunshine! ☀️"
- Notification shows the sender's buddy emoji and name

### Sunshine Daily Quest
"Community Gardener" — Send sunshine to any friend today. Reward: 10 💧

---

## Friendship Levels

Friendships level up over time based on mutual sunshine exchanges. There are 10 levels.

| Level | Name | Sunshine Exchanges Required | Reward |
|---|---|---|---|
| 1 | Neighbors | 0 (default) | — |
| 2 | Acquaintances | 5 | +5 💧 bonus |
| 3 | Friends | 15 | +10 💧 bonus |
| 4 | Good Friends | 30 | +15 💧 bonus |
| 5 | Close Friends | 50 | +25 💧 bonus + special badge |
| 6 | Plant Pals | 75 | +25 💧 bonus |
| 7 | Garden Friends | 100 | +30 💧 bonus |
| 8 | Kindred Spirits | 150 | +35 💧 bonus |
| 9 | Garden Soulmates | 200 | +40 💧 bonus |
| 10 | Eternal Gardeners | 300 | +50 💧 bonus + exclusive item |

Fern buddy users earn double friendship XP from all sunshine exchanges.

---

## Garden Town Screen

The Garden Town screen shows:

### 1. Friends List
Each friend card shows:
- Their buddy's emoji and name
- Growth stage badge
- Last active (e.g. "Active today", "Active 3 days ago")
- Friendship level indicator
- ☀️ Shine button (active or greyed out depending on daily status)

### 2. Your Garden Code
Displayed prominently with a copy button and a share button (native share sheet).

### 3. Add Friend
Text input field for entering a friend's Garden Code.

### 4. Friendship Activity Feed (Phase 4 feature)
A simple chronological list of recent friendship events:
- "Maya's buddy Orchi just reached Seedling stage! 🌱"
- "Theo sent you sunshine ☀️"
- "Luna completed their first journey!"

No likes, no comments — just celebratory events.

---

## Visiting a Friend's Terrarium

Tapping a friend's card opens a read-only view of their terrarium:
- Their buddy in its current equip/stage/appearance
- Their terrarium background and furniture
- Their buddy's current mood (displayed as an emoji status)
- A "Send Sunshine" button if not already sent today

Users cannot interact with a friend's buddy — only observe and send sunshine.

---

## Privacy

- Garden Town is opt-in. Users who never create a buddy have no Garden Town presence.
- There is no public discovery or search. You can only connect via explicit code sharing.
- Users can remove a friend at any time (removes both directions)
- Users can regenerate their Garden Code if they want to stop receiving new requests (existing friends are unaffected)
- Last active status can be hidden in settings

---

## Database Models

```prisma
model BuddyFriendship {
  id              String    @id @default(cuid())
  fromBuddyId     String
  toBuddyId       String
  fromBuddy       Buddy     @relation("FriendshipFrom", fields: [fromBuddyId], references: [id])
  toBuddy         Buddy     @relation("FriendshipTo",   fields: [toBuddyId],   references: [id])

  // Level
  level           Int       @default(1)
  points          Int       @default(0)

  // Daily sunshine tracking
  lastSunshineSentAt  DateTime?
  totalSunshineSent   Int       @default(0)

  // Metadata
  connectedAt     DateTime  @default(now())
  isActive        Boolean   @default(true)

  @@unique([fromBuddyId, toBuddyId])
}

model SunshineEvent {
  id          String    @id @default(cuid())
  fromUserId  String
  toUserId    String
  sentAt      DateTime  @default(now())
  dewdropsAwarded Int   @default(3)
}
```

---

## API Endpoints

```typescript
// GET /buddy/social/friends
// Returns: list of friends with buddy info and friendship levels

// POST /buddy/social/friends/add
// Body: { gardenCode: "SPROUT-7X4K" }
// Returns: new friendship record

// DELETE /buddy/social/friends/:friendBuddyId
// Returns: 204 No Content

// POST /buddy/social/sunshine/:friendBuddyId
// Returns: { dewdropsAwarded: 3, newFriendshipPoints: 18 }

// GET /buddy/social/sunshine/today
// Returns: { sent: ["buddyId1", "buddyId2"], received: 3 }

// GET /buddy/social/friends/:friendBuddyId/terrarium
// Returns: friend's buddy state, equipped items, terrarium layout (read-only)

// GET /buddy/social/activity-feed
// Returns: recent friendship events for the activity feed
```
