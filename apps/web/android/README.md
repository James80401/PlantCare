# Android (Capacitor)

Native shell for Dr. Plant. Package: **`com.plantcare.app`**.

## Firebase push (FCM)

Gradle is already wired:

| File | What |
|------|------|
| `build.gradle` | `classpath 'com.google.gms:google-services:4.4.4'` |
| `app/build.gradle` | Applies `google-services` plugin when `google-services.json` exists |
| `AndroidManifest.xml` | `INTERNET` + `POST_NOTIFICATIONS` (Android 13+) |

### One-time setup

1. [Firebase Console](https://console.firebase.google.com/) → Add Android app → package **`com.plantcare.app`**
2. Download **`google-services.json`**
3. Copy to **`app/google-services.json`** (gitignored)
4. API `.env`: `FCM_SERVER_KEY=<Firebase Cloud Messaging server key>`
5. Sync and open:
   ```bash
   npm run mobile:sync -w @plant-care/web
   npm run mobile:android -w @plant-care/web
   ```

Template: `app/google-services.json.example`  
Helper: `npm run mobile:firebase-setup`

Full guide: [docs/guides/17-mobile-push-setup.md](../../../docs/guides/17-mobile-push-setup.md)

## Daily workflow

```bash
npm run mobile:sync -w @plant-care/web
npm run mobile:android -w @plant-care/web
```

Set `apps/web/.env.local` → `VITE_API_BASE_URL` to a URL your phone can reach (LAN IP or HTTPS API).
