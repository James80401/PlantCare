# Guide 10 — End-user product guide

> **Navigation:** [Guides INDEX](INDEX.md) · [User guide INDEX](../user-guide/INDEX.md)

This guide explains **how to use Plant Care** as a gardener. For click-by-click tutorials, see [11 — Tutorials](11-tutorials-and-walkthroughs.md).

---

## Account & sign-in

1. Open the app URL (e.g. http://localhost:5173 or your deployed site).
2. **Register** with email and password.
3. If email verification is enabled, check your inbox and click the link (or ask your admin to verify for test environments).
4. After admin approval, sign in and go directly to the garden dashboard.
5. Use **Forgot password** if needed.

Doc: [user-guide/landing-and-auth.md](../user-guide/landing-and-auth.md).

---

## Garden dashboard

Your home screen shows:

- **Greeting** and garden status line
- **Garden score** — overall care health (tap for insights)
- **Due today** and overdue counts
- **Today’s care** — tasks you can complete in one tap
- **Schedule suggestions** — optional schedule adjustments (you approve each one)
- **Weather advice** when location is set
- **Your plants** — filter **All / My / Shared** if you use a household

Doc: [user-guide/garden-dashboard.md](../user-guide/garden-dashboard.md).

---

## Adding plants

**From catalog:**

1. **+ Add plant** → search or browse species.
2. Pick species, set nickname, location (room), indoor/outdoor, light, pot size.
3. Save — tasks are generated automatically.

**Identify (Premium / limits):**

- Upload a photo on add-plant flow; PlantNet suggests species.

Doc: [user-guide/plant-profile.md](../user-guide/plant-profile.md) · Tutorial: [adding-a-plant.md](../tutorials/adding-a-plant.md).

---

## Browse & discover species

- **Browse plants** — filter by beginner-friendly, light, sort A–Z.
- **Recommended** — picks based on your profile.
- **Species detail** — growing profile, pests, toxicity, metadata.

Doc: [user-guide/browse-plants.md](../user-guide/browse-plants.md).

---

## Tasks & calendar

- **Tasks** page — grouped by day and care type (water, fertilize, …).
- **Calendar** — week/month view of upcoming care.
- On each task: **Complete**, **Skip** (with reason), **Snooze**, **Instructions**, **Why this date**.

Doc: [user-guide/task-calendar.md](../user-guide/task-calendar.md) · [completing-tasks.md](../tutorials/completing-tasks.md).

---

## Plant profile (five tabs)

| Tab | Use it to… |
|-----|------------|
| **Overview** | See photo, species, environment summary |
| **Care** | Read ongoing care guidance |
| **Tasks** | Manage this plant’s schedule |
| **Journal** | Add notes and progress photos |
| **Health** | Run diagnosis, chat with Dr. Plant |

---

## Health & Dr. Plant

1. Open **Health** tab.
2. Upload a clear photo + describe symptoms.
3. Review diagnosis and confidence.
4. Optionally start **Dr. Plant** chat for follow-up questions.
5. Add a **follow-up task** if recommended.

Tutorials: [one-shot-diagnosis.md](../tutorials/one-shot-diagnosis.md), [using-dr-plant-chat.md](../tutorials/using-dr-plant-chat.md).

---

## Journal

- Add entries with text and photos.
- Edit or delete past entries.
- Compare growth over time visually.

Tutorial: [journal-and-notes.md](../tutorials/journal-and-notes.md).

---

## Weather & location

1. **Settings** → set location (search or coordinates).
2. Dashboard shows **weather advice** (frost, rain, heat).
3. Outdoor watering tasks may offer **rain skip** when rain is forecast.

Doc: [user-guide/settings.md](../user-guide/settings.md).

---

## Household (shared care)

- Create a **household** garden.
- **Invite** someone by email; they accept the invite.
- **Share** specific plants — collaborators see shared tasks on their dashboard.
- View **activity** for the household.

Doc: [user-guide/household.md](../user-guide/household.md).

---

## Community

- Read posts from other growers.
- Share a tip or photo (optional link to species/plant).
- Delete your own posts.

Doc: [user-guide/community.md](../user-guide/community.md).

---

## Premium subscription

- Free tier: limited plants and monthly identifies.
- **Subscription** page → Stripe checkout for Premium.
- Premium unlocks higher limits and features marked in UI.

Doc: [user-guide/subscription.md](../user-guide/subscription.md).

---

## Mobile app

Install via Capacitor build or “Add to Home Screen” (PWA). Same account and data as web.

Doc: [12 — Mobile](12-mobile-and-client-packaging.md).

---

## Getting help

- In-app: Dr. Plant, care instructions on tasks.
- Testers: [tester-5-minute.md](../product/tester-5-minute.md).
- Full QA: [uat-checklist.md](../product/uat-checklist.md).
