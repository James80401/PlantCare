# API: Weather

> **Navigation:** [API INDEX](INDEX.md) · `apps/api/src/weather/`

| Method | Path |
|--------|------|
| GET | `/users/me/weather` |

Uses user `latitude` / `longitude`. OpenWeather when key set; mock otherwise.

May trigger `scheduler.postponeWateringForRain` from client integration.
