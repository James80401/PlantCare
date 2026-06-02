# Admin Audit Logging

Admin API actions are stored in `AdminAuditLog` for a rolling 30-day window.

Captured fields:

- admin actor id/email,
- action name,
- method and path,
- target user id when the route has one,
- request id,
- final status code and success/error outcome,
- duration,
- IP and user agent,
- small sanitized metadata.

Raw request bodies are not stored so passwords, tokens, and other secrets do not land in the database.

Admins can review the summary and recent entries from `/admin/registrations`.

Retention is enforced opportunistically whenever an admin audit record is written or read.
