# Mobile packaging

> **Navigation:** [Web INDEX](INDEX.md)

Dr. Plant uses [Capacitor](https://capacitorjs.com/) to package the existing Vite React app for native mobile shells. The web app remains the source of truth: build `apps/web`, then sync the generated `dist/` files into iOS or Android projects.

## Web/mobile API base URL

The browser dev server can keep using the Vite proxy with the default relative API base:

```bash
npm run dev:api
npm run dev:web
```

Native shells cannot call the browser-only `/api` proxy from `capacitor://localhost`. Before building a native app, create `apps/web/.env.local` and point the frontend at a backend the device can reach:

```bash
cp apps/web/.env.example apps/web/.env.local
# edit apps/web/.env.local
VITE_API_BASE_URL=https://api.example.com/api/v1
```

For testing against a local API from a physical device, use a LAN or tunnel URL and allow that origin in the API `CORS_ORIGIN`.

## Add native platforms

Run each platform add command once:

```bash
npm run mobile:add:android
npm run mobile:add:ios
```

The generated `android/` and `ios/` directories are native projects managed by Capacitor. Commit them when the team is ready to maintain native project files.

## Sync the app

After changing the web app or environment variables:

```bash
npm run mobile:sync
```

This runs the Vite build and copies the current web output into any added native platforms.

## Open native IDEs

```bash
npm run mobile:android
npm run mobile:ios
```

Android builds require Android Studio/SDK. iOS builds require macOS with Xcode.

## Mobile web install surface

The web app also includes a manifest and mobile metadata so browsers can present it as an installable standalone app when hosted over HTTPS.
