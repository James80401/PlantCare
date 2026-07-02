# Cloudflare pre-launch cache plan

> Navigation: [production-signoff.md](production-signoff.md) | [prelaunch-seo-subplan.md](../marketing/prelaunch-seo-subplan.md)

Use this only when we are ready to test edge delivery. Keep the app private/noindex unless launch mode is explicitly approved.

## Goal

Improve global first paint and LCP by serving static app bytes from Cloudflare edge while keeping HTML, auth, API, crawler files, and user data fresh.

## DNS setup

- Proxy `drplant.app` through Cloudflare.
- Proxy `www.drplant.app` and keep the permanent redirect to `https://drplant.app`.
- Keep `api.drplant.app` DNS-only for Tier F v1. Proxy it only in a later pass if API behavior is verified after the change; API responses should not be cached by a broad rule.

## Automated setup

Repo-side automation exists for the Tier F v1 web-only rollout:

```powershell
npm run cloudflare:tier-f:dry-run

$env:CLOUDFLARE_API_TOKEN = "<token with DNS edit + Cache Rules edit>"
npm run cloudflare:tier-f:apply
```

Optional env vars:

- `CLOUDFLARE_ZONE_ID` / `CF_ZONE_ID` if the zone should not be looked up by name.
- `CLOUDFLARE_ZONE_NAME` if this runbook is copied to another domain.

The script sets `drplant.app` and `www.drplant.app` to proxied, keeps `api.drplant.app` DNS-only,
installs the cache rules below, and purges Cloudflare cache after applying.

## Cache rules

Create these rules in order, or run the automation above:

1. Bypass app shell and auth routes:
   - `drplant.app/`
   - `drplant.app/admin*`
   - `drplant.app/garden*`
   - `drplant.app/login*`
   - `drplant.app/register*`
   - `drplant.app/verify-email*`
   - `drplant.app/forgot-password*`
   - `drplant.app/reset-password*`
   - `drplant.app/robots.txt`
   - `drplant.app/sitemap.xml`
   - `drplant.app/llms.txt`
   - Cache mode: bypass.

2. Cache hashed Vite assets:
   - `drplant.app/assets/*`
   - Cache mode: cache eligible content.
   - Respect origin headers.
   - Browser TTL: one year.

3. Cache public static assets:
   - `drplant.app/icons/*`
   - `drplant.app/marketing/*`
   - Respect origin headers.

4. Optional after API verification:
   - `api.drplant.app/care-guides/images/*`
   - `api.drplant.app/care-guides/photos/*`
   - Respect origin headers.
   - Do not cache `/uploads/*` unless we intentionally move user media to a public CDN policy.

## Safety checks

- Private-mode `robots.txt` still disallows crawling.
- Private-mode `sitemap.xml` still contains no public SEO URLs.
- Login/register/admin/garden routes still send `noindex,nofollow`.
- API auth, task completion, task snooze, Dr. Plant chat, and image upload still work after proxying.

## Measurement gate

Before enabling Cloudflare, save the hosted Lighthouse regional scores. After enabling it, rerun the same hosted test regions and compare:

- US West
- US East
- Finland
- Germany
- Japan
- Australia

Expected improvement should show mostly in FCP/LCP. TBT and CLS should remain near zero.
