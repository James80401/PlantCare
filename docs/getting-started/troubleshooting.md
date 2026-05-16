# Troubleshooting

> **Navigation:** [Getting started INDEX](INDEX.md)

## API won’t start

| Symptom | Check |
|---------|--------|
| Port in use | Free port 3001; kill stale `node` processes |
| Prisma error | `npm run db:generate` && `npm run db:push` |
| Missing `.env` | Copy from `.env.example` |

## Web blank / API errors

| Symptom | Check |
|---------|--------|
| 401 on all API calls | Log in again; tokens in `localStorage` |
| 502 / proxy errors | Ensure `dev:api` is running |
| Care images 404 | API build copies assets; restart `dev:api` |

## OpenAI / Dr. Plant

| Symptom | Check |
|---------|--------|
| 503 quota | Billing/credits on OpenAI account |
| Chat empty | `OPENAI_API_KEY` set; restart API |
| Wrong model | `OPENAI_MODEL` in `.env` |

Run: `npm run test:integrations`

## Email not arriving

- SMTP credentials and `FRONTEND_URL`
- Spam folder
- Without SMTP, verification is skipped — check `emailVerified` in DB

## Care guides missing sections

```bash
npm run db:seed
npx tsx scripts/verify-care-guides.mjs
```

## Mist tasks still showing outdoors

Change location on plant profile → **Save** (regenerates pending tasks). See [changing plant location](../tutorials/changing-plant-location.md).

## See also

- [OpenAI integration](../integrations/openai.md)
- [Growing environment](../care-guides/growing-environment.md)
