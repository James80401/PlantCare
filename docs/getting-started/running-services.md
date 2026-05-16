# Running and restarting services

> **Navigation:** [Getting started INDEX](INDEX.md)

## Development

| Command | Port | URL |
|---------|------|-----|
| `npm run dev:api` | 3001 | http://localhost:3001/api/v1 |
| `npm run dev:web` | 5173 | http://localhost:5173 |

Vite proxies `/api`, `/uploads`, and care-guide assets to the API (`apps/web/vite.config.ts`).

## Restart everything (Windows example)

Stop listeners on 3001 and 5173, then start both dev commands again.

## Health check

```bash
curl http://localhost:3001/api/v1/health
```

Species search without auth returns 401 — that still proves API is up.

## See also

- [Troubleshooting](troubleshooting.md)
- [Operations: scripts](../operations/scripts.md)
