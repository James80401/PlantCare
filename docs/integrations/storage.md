# File storage

> **Navigation:** [Integrations INDEX](INDEX.md)

User media uses the local `UPLOAD_DIR` volume and is served at `/uploads/`.
Production mounts `plantcare_prod_uploads` at `/app/apps/api/uploads`; this volume
is part of every production backup and restore drill.

`UploadService` decodes accepted files, rejects invalid signatures and unsafe
dimensions, rotates them, limits them to 4096 pixels on either side, strips
metadata, and stores them as generated-name WebP files. Replaced and deleted
records remove their managed media and cached thumbnails after the database
mutation succeeds.

Object storage is not an application upload backend. The optional
`BACKUP_S3_BUCKET` in the backup runbook is only an offsite destination for
backup artifacts.

## Orphan audit

The audit is dry-run by default and compares the upload volume with every media
reference in the database:

```bash
npm run media:audit
```

Review `orphanFiles`, `orphanThumbnails`, and `missingFiles`. A missing referenced
file exits with code 2 because it indicates a restore or storage-integrity issue.
The command also exits with code 2 and blocks deletion if any reference table
cannot be queried.
Only after reviewing a fresh backup may an operator delete the reported orphans:

```bash
npm run media:audit -- --delete
```

Inside the production API container, run the same commands from `/app`.
