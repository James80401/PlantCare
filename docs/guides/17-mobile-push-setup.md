# Mobile push setup (Android & iOS)

> **Navigation:** [operations/push-notifications.md](../operations/push-notifications.md) · [Guide 12 — Mobile](12-mobile-and-client-packaging.md)

End-to-end checklist for **Capacitor + Firebase Cloud Messaging**.

---

## 1. Firebase project

1. [Firebase Console](https://console.firebase.google.com/) → **Add project** (or use existing).
2. **Build → Cloud Messaging** → enable legacy API if needed for `FCM_SERVER_KEY`.
3. Copy **Server key** → API `.env`:
   ```env
   FCM_SERVER_KEY=your-server-key
   ```

---

## 2. Android

### Add native project (first time)

```bash
npm run build -w @plant-care/web
npm run mobile:add:android -w @plant-care/web
```

### Firebase Android app

1. Firebase → **Add app → Android**
2. Package name: `com.plantcare.app` (must match `capacitor.config.ts` `appId`)
3. Download **`google-services.json`**
4. Place at: `apps/web/android/app/google-services.json`

### Gradle (already scaffolded in repo)

Capacitor adds Firebase Gradle wiring automatically:

```gradle
// android/build.gradle
classpath 'com.google.gms:google-services:4.4.4'

// android/app/build.gradle — applied when google-services.json exists
apply plugin: 'com.google.gms.google-services'
```

`POST_NOTIFICATIONS` is in `AndroidManifest.xml` for Android 13+.

### Firebase Android app

1. Firebase → **Add app → Android**
2. Package name: `com.plantcare.app` (must match `capacitor.config.ts` `appId`)
3. Download **`google-services.json`**
4. Place at: `apps/web/android/app/google-services.json`

Or scaffold from template:

```bash
npm run mobile:firebase-setup
# Edit google-services.json with Firebase download, then sync
```

Run:

```bash
npm run mobile:sync -w @plant-care/web
npm run mobile:android -w @plant-care/web
```

### Test on device

1. API reachable from phone (`VITE_API_BASE_URL` in `apps/web/.env.local` → LAN IP or HTTPS staging).
2. Sign in → **Settings → Push notifications** on → save → allow OS prompt.
3. Trigger a buddy nudge (dev):
   ```bash
   curl -X POST http://<api>/api/v1/buddy/dev/scheduler/mood-nudges \
     -H "Authorization: Bearer $TOKEN"
   ```
4. Tap notification → app opens **Plant Buddy** or **Tasks** (deep link).

---

## 3. iOS (macOS required)

1. Firebase → **Add app → iOS** → bundle ID `com.plantcare.app`
2. Download **`GoogleService-Info.plist`** → `apps/web/ios/App/App/`
3. Xcode: enable **Push Notifications** capability + upload APNs key to Firebase.
4. `npm run mobile:sync -w @plant-care/web` && `npm run mobile:ios -w @plant-care/web`

APNs uses Firebase; server still sends via `FCM_SERVER_KEY` to FCM registration tokens from Capacitor.

---

## 4. App behavior (this branch)

| Feature | Implementation |
|---------|----------------|
| Register token | `registerPushNative()` after login + Settings save |
| Re-register | `@capacitor/app` resume when push enabled |
| Unregister | Logout or disable push in Settings → `DELETE /devices` |
| Tap notification | `pushNotificationActionPerformed` → navigate `data.route` |
| Deep links | FCM `data.route`: `/garden/buddy`, `/garden/buddy/journey`, `/garden/tasks` |

Local token cache: `localStorage` key `plantcare_device_push_token`.

---

## 5. Preflight script

```bash
npm run mobile:push-check
```

Verifies Capacitor push packages, config plugins, and optional `google-services.json` path.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| No OS permission prompt | Native only; enable push in Settings and save |
| `[push mock]` in API logs | Set `FCM_SERVER_KEY` or register device token |
| Token never registers | Add `google-services.json`, sync, rebuild Android |
| Notification tap does nothing | Ensure FCM payload includes `data.route` (API sends automatically) |
