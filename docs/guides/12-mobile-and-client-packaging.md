# Guide 12 — Mobile & client packaging

> **Navigation:** [Guides INDEX](INDEX.md) · [web/mobile-packaging.md](../web/mobile-packaging.md)

## Approaches

| Client | Technology | When to use |
|--------|------------|-------------|
| **Web SPA** | Vite build | Browser, primary surface |
| **PWA** | Web manifest + service worker patterns | Install to home screen |
| **Capacitor** | Native shell loading built web assets | iOS/Android store builds |

All clients call the **same REST API** with JWT auth.

---

## Capacitor workflow

From repo root:

```bash
npm run build -w @plant-care/web
npm run mobile:copy      # copy dist into native projects
npm run mobile:sync      # cap sync
npm run mobile:add:android   # first-time platform add
npm run mobile:android   # open Android Studio
```

iOS: `mobile:add:ios`, `mobile:ios` (requires macOS).

---

## API URL on devices

Physical devices cannot use `localhost`. Set:

- `apps/web/.env.local` → `VITE_API_BASE_URL=http://<your-lan-ip>:3001/api/v1`
- Rebuild web before `mobile:copy`

Staging/production: use public HTTPS API URL baked at build time.

---

## Push notifications

- API: `POST /devices` / `DELETE /devices` register FCM tokens; `FCM_SERVER_KEY` sends real push.
- Mobile: `@capacitor/push-notifications` + Firebase (`google-services.json` / APNs).
- Full setup: [17 — Mobile push setup](17-mobile-push-setup.md) · [push-notifications.md](../operations/push-notifications.md)

---

## Store release checklist

1. Production API + HTTPS.
2. Update app icons and splash (`apps/web` Capacitor config).
3. Version bump in native projects.
4. Test login, add plant, complete task on device.
5. Privacy policy URL for store listing.

---

## PWA notes

- Production web build can be served as installable static site (Docker nginx on :8080).
- Ensure `FRONTEND_URL` and API CORS match deployed origins.

---

## Related

- [07 — Web application](07-web-application.md)
- [13 — Operations](13-operations-deployment-and-quality.md)
- [14 — Product roadmap](14-product-qa-and-roadmap.md)
