# API: Weather

> **Navigation:** [API INDEX](INDEX.md) · `apps/api/src/weather/`

| Method | Path |
|--------|------|
| GET | `/users/me/weather/locations?q=` |
| GET | `/users/me/weather/advice/status` |
| POST | `/users/me/weather/advice` |

POST body: `{ "confirmed": true }` (required).

Uses user `latitude` / `longitude` from [notification settings](users.md).

See [integrations/weather.md](../integrations/weather.md).
