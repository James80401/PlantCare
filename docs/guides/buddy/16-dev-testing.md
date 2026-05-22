# Plant Buddy — Dev testing

> **Navigation:** [Buddy guides INDEX](INDEX.md)

## Manual cron triggers (API)

When `NODE_ENV` is not `production`, or `ENABLE_DEV_ROUTES=true`, authenticated users can run scheduler jobs once:

| Method | Path | Effect |
|--------|------|--------|
| POST | `/api/v1/buddy/dev/scheduler/complete-journeys` | Finish journeys past `endsAt` |
| POST | `/api/v1/buddy/dev/scheduler/reset-daily-sunlight` | Run daily sunlight reset for all buddies |
| POST | `/api/v1/buddy/dev/scheduler/mood-nudges` | Send wilting/dormant mood nudges (respects once-per-day tag) |

Example (after login):

```bash
curl -X POST http://localhost:3001/api/v1/buddy/dev/scheduler/complete-journeys \
  -H "Authorization: Bearer $TOKEN"
```

## Scripts

```bash
npm run dev:api
npm run smoke:buddy          # quick API smoke
API_URL=http://localhost:3001/api/v1 npm run verify
```

## Journey timer

Use **complete-journeys** after setting `endsAt` in the past via Prisma Studio, or wait for the every-minute cron in dev.
