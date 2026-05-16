# File storage

> **Navigation:** [Integrations INDEX](INDEX.md)

**Local (default):** `UPLOAD_DIR=./apps/api/uploads` — served at `/uploads/`

**S3 (optional):**

```env
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
S3_BUCKET=
S3_PUBLIC_URL=
```

`UploadService` selects backend based on configuration.
