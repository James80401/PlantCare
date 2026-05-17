# npm scripts reference

> **Navigation:** [Reference INDEX](INDEX.md) · Root `package.json`

| Script | Action |
|--------|--------|
| `dev:api` | Nest watch, port 3001 |
| `dev:web` | Vite, port 5173 |
| `build` | shared + api + web |
| `species:verify` | Validate species catalog fields and discovery-filter coverage |
| `mobile:copy` | Build web and copy assets into added Capacitor platforms |
| `mobile:sync` | Build web and sync assets/plugins into added Capacitor platforms |
| `mobile:add:android` | Build web and add the Capacitor Android project |
| `mobile:add:ios` | Build web and add the Capacitor iOS project |
| `mobile:android` | Build/sync web and open the Android project |
| `mobile:ios` | Build/sync web and open the iOS project |
| `test` | API Jest |
| `test:integrations` | SMTP + OpenAI smoke |
| `db:generate` | Prisma generate |
| `db:migrate` | prisma migrate dev |
| `db:push` | prisma db push |
| `db:seed` | tsx prisma/seed.ts |
| `db:studio` | Prisma Studio |
