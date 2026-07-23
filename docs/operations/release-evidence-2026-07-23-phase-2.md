# Phase 2 data-safety and deployment evidence

> **Date:** 2026-07-23  
> **Release:** `e4a41b1e3ce39b3c60d8356bc1d039dae6149ed1`  
> **Production gates:** Plant Buddy disabled, Premium billing disabled

## PostgreSQL

- A dedicated PostgreSQL schema and migration history live under
  `prisma/postgresql`.
- The baseline migration passed `migrate deploy` on an empty PostgreSQL 16
  database.
- A schema synthesized through the former production `db push` path produced
  an empty diff against the baseline, which was then recorded as applied.
- The live production schema produced an empty diff before baseline
  reconciliation.
- API container startup now starts only Node; migration and seeding are
  explicit release steps.
- The production deploy reported no pending migrations and repeated catalog
  synchronization retained 456 total species.

## Backup and restore

- Pre-migration backup: `20260723T204909Z`.
- Automated release backup: `20260723T214320Z`.
- Backups include PostgreSQL and managed uploads plus a SHA-256 manifest.
- The restore drill recovered 10 users, 41 plants, 4 diagnoses, 31 referenced
  photos, and 210 upload files. The source production database contained no
  journal rows at drill time.
- Restored database, upload references, application health, and readiness spot
  checks passed.

## Deployment and rollback

- [CI run 30047081133](https://github.com/James80401/PlantCare/actions/runs/30047081133)
  passed the required `test` and `postgres` jobs, including the production API
  image runtime-dependency check.
- [Deploy run 30047269307](https://github.com/James80401/PlantCare/actions/runs/30047269307)
  deployed the exact tested release after preflight, backup, migration,
  idempotent seed synchronization, and readiness.
- Non-mutating production probes passed API health, release identity and
  feature gates, database/uploads readiness, production-origin CORS, and web
  static content.
- An earlier cutover exposed an incomplete runtime image. The preserved
  previous application images were restored against the migrated database,
  and web, health, and readiness returned HTTP 200. The runtime dependency and
  rollback-order defects were then fixed and guarded by CI before the
  successful automated deployment.
- Production health reports commit
  `e4a41b1e3ce39b3c60d8356bc1d039dae6149ed1`; both gated features report
  `false`.

## Exit decision

Phase 2 is complete. Fresh and existing PostgreSQL paths, non-mutating startup,
backup integrity, restore, application rollback, exact-SHA deployment, and
production sign-off have recorded evidence.
