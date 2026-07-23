# Phase 3 authentication, security, and media evidence

> **Date:** 2026-07-23
>
> **Production release:** `28000aea5966a41b923a103793c6233b6eb76d47`
>
> **State:** implementation complete; legal approval input pending

## Authentication and web security

- The compatibility auth release was deployed at `ee366946`; the final
  cookie-only contract was deployed at `56d70f8`.
- Refresh tokens are stored in constrained HttpOnly cookies. Browser access
  tokens remain in memory, refresh is single-flight, logout clears only
  Dr. Plant-owned client state, and refresh/logout validate allowed origins.
- Credentialed requests cover the production web and Capacitor origins.
- Production web responses include the approved CSP, HSTS, frame,
  content-type, referrer, and permissions headers. Swagger is disabled unless
  its explicit operations flag is enabled.
- [Deploy run 30049480902](https://github.com/James80401/PlantCare/actions/runs/30049480902)
  deployed the final auth/security contract after required CI passed.

## Validation, account lifecycle, and media

- Notification-device, care-preference, and weather-confirmation inputs use
  validated DTOs.
- Uploads are decoded by signature, dimension-checked, normalized to safe WebP,
  stripped of metadata, and assigned managed UUID paths.
- Replacement/deletion paths remove plant, journal, progress, diagnosis, chat,
  and community media. Account deletion requires the current password, revokes
  sessions, cancels active Stripe subscriptions, deletes owned data, and
  removes its managed media.
- The media audit command is dry-run by default, blocks deletion when any
  database reference query fails, and is covered in both SQLite and PostgreSQL
  CI.
- [CI run 30051050122](https://github.com/James80401/PlantCare/actions/runs/30051050122)
  and [deploy run 30051216648](https://github.com/James80401/PlantCare/actions/runs/30051216648)
  passed for the media/account-lifecycle release.

## Production orphan reconciliation

- The first post-deploy dry run found 32 referenced files, 42 stored originals,
  10 unreferenced originals, no missing referenced files, and 168 stale
  thumbnails.
- The explicit cleanup removed those 178 unreferenced/cache files. The
  automated deploy backup taken immediately beforehand is the recovery source.
- A second dry run reported 32 referenced files, 32 stored files, zero orphan
  originals, zero missing files, zero orphan thumbnails, zero query failures,
  and zero deletions.

## Remaining legal gate

The Terms and Privacy copy cannot be truthfully finalized without:

1. The operator's legal name.
2. A monitored support/privacy email address.
3. The governing state/province and country.

Those values must be approved and configured before Phase 3 is marked complete.
