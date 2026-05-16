# API overview

> **Navigation:** [API INDEX](INDEX.md)

- **Framework:** NestJS 10+
- **ORM:** Prisma
- **Auth:** Passport JWT
- **Validation:** class-validator DTOs
- **Docs:** Swagger at `/api/docs`

## Module map (`app.module.ts`)

Auth, Users, Species, Plants, Tasks, Journal, Diagnosis, Billing, Notifications, Weather, Prisma, Upload, Email, Scheduler (internal), CareGuides (internal).

## Conventions

- Protected routes: `@ApiBearerAuth()` + `JwtAuthGuard`
- Errors: Nest `NotFoundException`, `UnauthorizedException`, etc.
- File uploads: `FileInterceptor('image')`
