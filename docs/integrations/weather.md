# Weather integration (on-demand)

> **Navigation:** [Integrations INDEX](INDEX.md)

Dr. Plant uses **[Open-Meteo](https://open-meteo.com/)** — free, no API key required.

## User flow

1. **Settings (optional):** City/address search or device location → stored as `latitude`, `longitude`, `locationLabel`, `timezone`. Geocoding only; no forecast on save.
2. **Dashboard:** User taps **Advise by weather** → confirmation modal → one forecast fetch per calendar day (user timezone).
3. **Same day:** Results are cached; user can view again without another Open-Meteo call.

## API

| Method | Path |
|--------|------|
| GET | `/users/me/weather/locations?q=` | City search (Settings) |
| GET | `/users/me/weather/advice/status` | `hasLocation`, `canFetchToday`, cached payload |
| POST | `/users/me/weather/advice` | Body `{ confirmed: true }` — fetch or return cache |

## Cache

`WeatherAdviceCache` table: one row per user, keyed by local date + rounded lat/lon. Invalidated when location changes in settings.

## Per-plant advice

`plant-weather-advice.ts` uses each plant's **location** field and `inferGrowingEnvironment()` for frost, heat, and rain copy.

## Environment

```env
# Optional fallback only — not used when Open-Meteo succeeds
OPENWEATHER_API_KEY=
```

Rain-smart schedule changes are **not** applied automatically when fetching advice (advice-only v1).
