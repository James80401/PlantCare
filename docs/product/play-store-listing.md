# Google Play store listing copy

> **Navigation:** [google-play-closed-testing.md](google-play-closed-testing.md) · [Guide 15](../guides/15-production-deploy-and-android.md)

Paste and customize before **Closed testing** or **Production**. Replace `yourdomain.com` with your real host.

## App identity

| Field | Value |
|-------|--------|
| App name | Plant Care |
| Package | `com.plantcare.app` |
| Category | House & home (or Lifestyle) |
| Privacy policy | `https://yourdomain.com/privacy` |

## Short description (max 80 characters)

```
Smart plant care reminders, journals, and Dr. Plant health tips for your garden.
```

## Full description

```
Plant Care helps you keep houseplants and garden plants thriving without guesswork.

• Care schedule — watering, fertilizing, pruning, pest checks, and more
• Today’s tasks — see what’s due, overdue, or done at a glance
• Plant profiles — species guides with beginner and advanced care detail
• Journal — notes, photos, and growth measurements over time
• Dr. Plant — ask questions and run symptom checks when something looks off
• Weather-aware tips — optional location-based outdoor watering advice
• Plant Buddy — light gamification to build a gentle care rhythm (optional)
• Community — share tips with other gardeners (optional)

Plant Care is in beta. All premium features may be enabled during testing. Feedback welcome.

Requires an account. Internet connection required for sync and diagnosis features.
```

## Release notes (example — Closed testing build 1)

```
First closed test build.

• Garden dashboard and care tasks
• Plant profiles with structured care guides
• Journal with photos and measurements
• Dr. Plant chat and diagnosis on the Health tab
• Push notification support when Firebase is configured

Please report issues via your UAT channel. Thank you for testing!
```

## Data safety (Play Console questionnaire — draft answers)

Declare honestly; adjust if your deployment differs.

| Data type | Collected? | Purpose | Shared? |
|-----------|------------|---------|---------|
| Email address | Yes | Account, sign-in | No (unless you use a third-party auth provider) |
| Name | Optional | Display in app | No |
| Photos | Yes | Plant/journal/diagnosis | No (stored on your servers / S3) |
| Approximate location | Optional | Weather advice | Sent to weather API provider if enabled |
| App activity (care tasks) | Yes | Core functionality | No |
| Device or other IDs | Yes (if push on) | FCM push tokens | Google (Firebase) |

**Security:** Data encrypted in transit (HTTPS). Users can delete account from Settings (describe your process in Privacy Policy).

**Ads:** No ads in current build.

## Graphics checklist

| Asset | Size | Notes |
|-------|------|--------|
| App icon | 512×512 PNG | High-res export from adaptive icon |
| Feature graphic | 1024×500 | Optional for listing polish |
| Phone screenshots | 2+ | Dashboard, plant profile, tasks — capture from device or Playwright |
| 7-inch / 10-inch | Optional | Tablet if you support tablets |

Capture screenshots from a **release** build pointed at production API so content looks real.

## Tester email blurb

```
You're invited to test Plant Care on Android (closed beta).

1. Open this link on your Android phone (signed into Google): [Play opt-in URL from Console]
2. Accept the invite and install from the Play Store.
3. Register with your email and verify if prompted.
4. Add a plant and try completing a care task.

Privacy: https://yourdomain.com/privacy
Questions: [your contact]
```
