# Environment variables (complete)

> **Navigation:** [Reference INDEX](INDEX.md) · Template: `.env.example`

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | SQLite file or PostgreSQL URL |
| `JWT_SECRET` | Access token signing |
| `JWT_EXPIRES_IN` | Access token TTL |
| `JWT_REFRESH_SECRET` | Refresh token signing |
| `JWT_REFRESH_EXPIRES_IN` | Refresh TTL |
| `PORT` | API port (3001) |
| `FRONTEND_URL` | Links in emails |
| `CORS_ORIGIN` | Allowed browser origin |
| `SMTP_HOST` | Mail server |
| `SMTP_PORT` | Mail port (587) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `EMAIL_FROM` | From header |
| `PERENUAL_API_KEY` | Species API |
| `PLANTNET_API_KEY` | Plant ID API |
| `HF_API_TOKEN` | Hugging Face |
| `OPENAI_API_KEY` | OpenAI |
| `OPENAI_MODEL` | Model name |
| `OPENAI_BASE_URL` | API base URL |
| `OPENWEATHER_API_KEY` | Weather |
| `STRIPE_SECRET_KEY` | Stripe |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature |
| `STRIPE_PRICE_ID_PREMIUM` | Price ID |
| `SENDGRID_API_KEY` | SendGrid email |
| `SENDGRID_FROM_EMAIL` | SendGrid from |
| `TWILIO_ACCOUNT_SID` | SMS |
| `TWILIO_AUTH_TOKEN` | SMS |
| `TWILIO_FROM_NUMBER` | SMS from |
| `FIREBASE_PROJECT_ID` | Push (planned) |
| `AWS_ACCESS_KEY_ID` | S3 |
| `AWS_SECRET_ACCESS_KEY` | S3 |
| `AWS_REGION` | S3 region |
| `S3_BUCKET` | Bucket name |
| `S3_PUBLIC_URL` | Public URL base |
| `UPLOAD_DIR` | Local uploads path |
| `ALL_USERS_PREMIUM` | Dev: skip Stripe limits |
