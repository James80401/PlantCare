# Email and auth setup (SMTP)

> **Navigation:** [Getting started INDEX](INDEX.md) · [API authentication](../api/authentication.md)

When `SMTP_USER` and `SMTP_PASS` are set, new users must verify email before login.

## Gmail App Password

1. Enable 2-Step Verification on Google account
2. Create [App Password](https://myaccount.google.com/apppasswords) for Mail
3. Add to `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM="Plant Care <you@gmail.com>"
FRONTEND_URL=http://localhost:5173
```

Restart API — log should indicate SMTP ready.

## Test flows

- **Register** → email link → `/verify-email/:token`
- **Forgot password** → `/reset-password/:token`

Without SMTP, users are **auto-verified** for local convenience.

## See also

- [User guide: auth](../user-guide/landing-and-auth.md)
- [SMTP integration](../integrations/smtp.md)
