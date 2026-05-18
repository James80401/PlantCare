# 5-minute tester script

Use this for remote UAT on **staging** (`http://localhost:8080`) or **production** (your deployed URL).

## Before you start

- You need a browser on phone or desktop.
- If email verification is enabled, use a real inbox you can open.
- Premium is enabled for all testers in current builds.

## Steps (about 5 minutes)

1. **Open the app** at the URL your team shared (not `localhost` unless you run it locally).
2. **Register** with email + password (8+ characters). Complete verification if prompted.
3. **Onboarding** — tap **Get started**, pick experience (e.g. Beginner) and light (e.g. Medium), then **Continue**.
4. **Add a plant** — **Add your first plant** → **Search by name instead** → type `snake` → choose **Snake Plant** → **Save plant**.
5. **Dashboard** — open **Garden**; confirm you see a greeting and at least one care task or plant card.
6. **Browse** — **Browse** → confirm **Recommended for you** appears → open any species → scroll to **Growing profile** (pests, humidity).
7. **Complete one task** — **Tasks** → open a task → mark **Done** (or skip with a reason).
8. **Optional** — **Settings** → set location → **Garden** → **Advise by weather** (once per day).

## Report issues with

- Device + browser
- Screenshot
- Time (UTC) and the email you used (no password)

## Automated checks (dev team)

```bash
npm run verify
npm run uat:e2e
npm run staging:smoke   # Docker staging before sharing a public link
```

See [uat-checklist.md](./uat-checklist.md) and [deployment.md](../operations/deployment.md).
