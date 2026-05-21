# Tutorial: First-time user

> **Navigation:** [Tutorials INDEX](INDEX.md) · [User guide: auth](../user-guide/landing-and-auth.md)

1. Open http://localhost:5173
2. **Register** with email and password (or **Login** if you already have an account)

## If email verification is enabled (SMTP configured)

3. After register, you may see a message to check your inbox — you **cannot** use the garden until verified
4. Click the link in the email → `/verify-email/:token` → you are signed in and redirected to `/garden`
5. Or use **Resend verification** at `/resend-verification`, then **Login** after verifying

## If verification is off (default local dev)

3. Register signs you in immediately
4. You land on **Garden** (`/garden`)

## After you can access the garden

5. Explore the [dashboard](../user-guide/garden-dashboard.md) — plants and upcoming tasks
6. **Add plant** → `/garden/plants/new`

Next: [Adding a plant](adding-a-plant.md)
