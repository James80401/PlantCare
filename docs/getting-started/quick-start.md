# Quick start

> **Navigation:** [Getting started INDEX](INDEX.md) · [Master INDEX](../INDEX.md)

## Prerequisites

- Node.js **20+**
- npm (comes with Node)

## Steps

```bash
cd PlantCare
cp .env.example .env
npm install
npm run db:generate
npm run db:push
npm run db:seed
```

## Run

```bash
npm run dev:api   # port 3001
npm run dev:web   # port 5173
```

Open **http://localhost:5173** — register or log in, then **/garden**.

**Demo account** (after `npm run db:seed`): `demo@plantcare.local` / `DemoPlant1!` — includes two plants, an open diagnosis, and a sample Dr. Plant chat.

## Verify (optional)

With API running:

```bash
node scripts/verify.mjs
npx tsx scripts/verify-care-guides.mjs
```

## See also

- [Environment](environment.md)
- [Database](database.md)
- [Troubleshooting](troubleshooting.md)
