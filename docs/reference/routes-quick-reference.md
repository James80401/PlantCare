# Routes quick reference

> **Navigation:** [Reference INDEX](INDEX.md) · [API INDEX](../api/INDEX.md)

**API base:** `/api/v1`

## Auth

`POST /auth/register` · `login` · `refresh` · `verify-email/:token` · `resend-verification` · `forgot-password` · `reset-password`

## Users

`GET /users/me` · `PUT /users/me/notification-settings` · `DELETE /users/me` · `GET /users/me/weather`

## Species

`GET /species/search` · `GET /species/:id`

## Plants

`GET|POST /plants` · `GET|PATCH|DELETE /plants/:id` · `POST /plants/identify` · `POST /plants/upload`

## Diagnosis

`POST /plants/:id/diagnose`  
`GET|POST /plants/:plantId/diagnose/conversations`  
`GET /plants/:plantId/diagnose/conversations/:id`  
`POST /plants/:plantId/diagnose/conversations/:id/messages`

## Journal

`GET|POST /plants/:plantId/journal`

## Tasks

`GET /tasks` · `PATCH /tasks/:id/complete` · `PATCH /tasks/:id/skip` · `GET /tasks/:id/instructions`

## Other

`GET /health` · `POST /billing/checkout` · `POST /billing/webhook` · `POST /devices`

## Web routes

See [web/routing.md](../web/routing.md)
