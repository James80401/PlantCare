# Google Play — closed testing (private)

> **Navigation:** [Product INDEX](INDEX.md) · [Guide 15](../guides/15-production-deploy-and-android.md)

Use this when the app is **not** ready for public search but you want real installs from the Play Store.

## Tracks (pick one)

| Track | Max testers | Best for |
|-------|-------------|----------|
| **Internal testing** | 100 | You + core team |
| **Closed testing** | Larger invite list | Friends, beta gardeners |

Neither track makes the app visible in public Play Store search.

## Prerequisites

- [ ] Google Play Developer account ($25)
- [ ] HTTPS API live (`https://api.yourdomain.com/api/v1/health` returns OK)
- [ ] Signed **AAB** from Android Studio
- [ ] Package ID: `com.plantcare.app` (from `capacitor.config.ts`)
- [ ] Privacy policy URL: `https://app.yourdomain.com/privacy`
- [ ] App icon + screenshots (can use staging web)

## Play Console steps

1. **Create app** → default language, app name “Plant Care”.
2. **App content** → privacy policy link, ads declaration (likely “No”), content rating questionnaire.
3. **Data safety** → declare data collected (account email, plant photos, location if used).
4. **Release → Testing → Closed testing** (or Internal).
5. **Create new release** → upload AAB.
6. **Testers** → add email list → copy opt-in link.
7. Testers open link on Android device, accept, install from Play Store.

## After upload

- Review may take hours to a few days on first upload.
- Use **Pre-launch report** in Console for crash hints.

## Promoting later

- Closed → **Production** only when you want a public listing.
- You can keep Closed testing running indefinitely.

## Not on Play Store?

- **Firebase App Distribution** — private APK/AAB, no store.
- **USB / APK sideload** — developers only.
