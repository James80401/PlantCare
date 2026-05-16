# Testing

> **Navigation:** [Operations INDEX](INDEX.md)

## API (Jest)

```bash
npm run test
```

Specs:

- `scheduler.service.spec.ts`
- `growing-environment.spec.ts`

## Web (Vitest)

```bash
npm run test -w @plant-care/web
```

- `AuthContext.test.tsx`

## Manual E2E

`node scripts/verify.mjs` with dev servers running.
