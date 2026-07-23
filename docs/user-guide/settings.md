# User guide: Settings

> **Navigation:** [User guide INDEX](INDEX.md) - [Web: settings](../web/pages/settings.md)

**Route:** `/garden/settings`

- Profile name
- Notification preferences (push, email, SMS flags)
- **Optional** location for weather (city search, device location, or lat/lon)
- Care preferences and default guide detail.
- Plant Buddy display preference.
- Household management shortcut.

Forecast runs only when you tap **Advise by weather** on the dashboard (once per day). See [integrations/weather.md](../integrations/weather.md).

## Delete account

At the bottom of the page, **Delete account and plant data** opens a protected
confirmation panel. Enter your current password and confirm the final warning.
The app cancels any active subscription before removing the account, plant data,
community content, conversations, and managed photos (`DELETE /users/me`).
