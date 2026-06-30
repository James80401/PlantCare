# Google Play — closed testing program (G4)

> **Navigation:** [Product INDEX](INDEX.md) · [play-store-listing.md](play-store-listing.md) · [Guide 15](../guides/15-production-deploy-and-android.md) · [production-signoff.md](../operations/production-signoff.md)

End-to-end path from **production API** to **private Play Store installs** (not public search).

## Quick start

```bash
# 1. Production env + deploy (see G3)
cp .env.production.example .env.production   # edit secrets + URLs
npm run production:check
npm run production:up
npm run production:signoff -- --live

# 2. Mobile build config
cp apps/web/.env.mobile.example apps/web/.env.local   # set VITE_API_BASE_URL
npm run mobile:store-check
npm run mobile:store-check -- --live
npm run mobile:push-check          # optional, for device push

# 3. Native release
npm run mobile:release:android     # opens Android Studio
# Build → Generate Signed Bundle / APK → Android App Bundle (.aab)

# 4. Play Console → Testing → Closed testing → upload AAB → add testers
```

## Automated preflight

| Command | What it checks |
|---------|----------------|
| `npm run mobile:store-check` | Package ID, Android project, version, icons, `VITE_API_BASE_URL`, privacy route |
| `npm run mobile:store-check -- --live` | Above + `GET /health` and `GET /privacy` on public URLs |
| `npm run mobile:push-check` | Capacitor push plugin + `google-services.json` + API FCM env |
| `npm run mobile:preflight` | Runs store-check + push-check |

## Tracks

| Track | Max testers | Best for |
|-------|-------------|----------|
| **Internal testing** | 100 | You + core team (fastest iteration) |
| **Closed testing** | Large email list | Friends, beta gardeners |

Neither track lists the app in public Play search.

## Prerequisites checklist

- [ ] Google Play Developer account ($25 one-time)
- [ ] HTTPS API live (`npm run production:signoff -- --live`)
- [ ] `apps/web/.env.local` with production `VITE_API_BASE_URL`
- [ ] `npm run mobile:store-check -- --live` passes
- [ ] Signed **AAB** (upload keystore saved securely; enable Play App Signing)
- [ ] Package ID `com.plantcare.app` matches Capacitor + Play Console
- [ ] Privacy policy URL: `https://yourdomain.com/privacy`
- [ ] Store listing copy from [play-store-listing.md](play-store-listing.md)
- [ ] Content rating questionnaire completed
- [ ] Data safety form completed (draft answers in listing doc)
- [ ] Tester opt-in link shared

## Play Console workflow

1. **Create app** → name “Dr. Plant”, default language, package `com.plantcare.app`.
2. **App content** → Privacy policy URL, ads (No), content rating, target audience.
3. **Data safety** → use [play-store-listing.md](play-store-listing.md) draft table; adjust for your deployment.
4. **Main store listing** → short/full description, icon, screenshots.
5. **Release → Testing → Closed testing** (or Internal for first smoke).
6. **Create release** → upload `.aab` → add release notes.
7. **Testers** → email list → copy **opt-in link** → testers install from Play Store.
8. Review **Pre-launch report** after first upload (crashes, permissions).

## Versioning

Before each new upload, increment in `apps/web/android/app/build.gradle`:

```gradle
versionCode 2        // integer, must increase every upload
versionName "1.0.1"  // user-visible string
```

Then `npm run mobile:release:android` and generate a new AAB.

## CORS and mobile WebView

The API allows Capacitor origins (`https://localhost`, `capacitor://localhost`) automatically. Browser users use `CORS_ORIGINS` / `FRONTEND_URL` from `.env.production`.

## Push on test devices (optional)

1. `npm run mobile:firebase-setup` — place `google-services.json` in `android/app/`.
2. API `.env.production`: FCM HTTP v1 credentials (see [17-mobile-push-setup.md](../guides/17-mobile-push-setup.md)).
3. Rebuild AAB and reinstall via Play track.

## Promoting later

- **Closed → Production** when ready for public listing.
- You can keep Closed testing running indefinitely for a private beta cohort.

## Alternatives to Play

| Method | When |
|--------|------|
| **Firebase App Distribution** | APK/AAB without Play review |
| **USB debug install** | Developers only |
| **PWA** | Web only; add to home screen |

## Related

- [tester-5-minute.md](tester-5-minute.md) — what testers do after install
- [a11y-checklist.md](a11y-checklist.md) — mobile UX quality
- [operations/production-signoff.md](../operations/production-signoff.md) — server gate (G3)
