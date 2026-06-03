# Push notifications

## Server (FCM)

Buddy nudges, task reminders, and sunshine alerts use `NotificationsService.sendPush`.

1. Create a Firebase project and enable **Cloud Messaging**.
2. Copy the **Server key** (Legacy) or migrate to HTTP v1 later.
3. Set in API `.env`:

```env
**Preferred (FCM HTTP v1):** `FIREBASE_PROJECT_ID` plus service account via `GOOGLE_APPLICATION_CREDENTIALS` (JSON file path) or `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY`.

**Legacy fallback:** `FCM_SERVER_KEY=your-firebase-server-key`
```

4. Restart the API. With no key, pushes are logged to `NotificationLog` as mock entries (same as zero registered devices).

Invalid FCM tokens are removed automatically after a failed send.

## Client registration

Authenticated clients register tokens:

```http
POST /api/v1/devices
Authorization: Bearer <accessToken>
{ "token": "<fcm-registration-id>", "platform": "android" | "ios" | "web" }
```

### Capacitor (recommended for mobile)

The web app depends on `@capacitor/push-notifications`. After `npm run mobile:sync`, the layout hook `useRegisterPushDevice` requests permission and registers the token when the user has **Push notifications** enabled in Settings.

```bash
npm install @capacitor/push-notifications -w @plant-care/web
npm run mobile:sync -w @plant-care/web
```

Configure Firebase in the Android/iOS native projects per [17-mobile-push-setup.md](../guides/17-mobile-push-setup.md), then set `FCM_SERVER_KEY` on the API.

### Deep links (mobile tap)

FCM `data.route` opens in-app:

| Notification | Route |
|--------------|-------|
| Buddy journey / sunshine | `/garden/buddy/journey` |
| Mood nudge | `/garden/buddy` |
| Task reminders | `/garden/tasks` |

Preflight: `npm run mobile:push-check`

Users must enable **Push notifications** in Settings (`notifyPush`).

## Buddy notification types

| Tag | Trigger |
|-----|---------|
| `buddy` | Journey complete, sunshine received |
| `mood` | Daily cron for wilting/dormant buddies (max once per day per user) |
| `push` | Task due reminders |
