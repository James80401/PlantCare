# Models: Diagnosis, journal, notifications

> **Navigation:** [Models INDEX](INDEX.md)

## Diagnosis

One-shot: `resultLabel`, `confidence`, `adviceText`, `detailJson`, `source`.

## DiagnosisConversation / DiagnosisMessage

Chat threads per plant; messages have `role` (user/assistant), `content`, optional image URL.

## JournalEntry

`notes`, optional `photoUrl`, `plantId`.

## NotificationLog / DeviceToken

`NotificationLog` is the per-user, per-channel delivery ledger. It records a
dedupe key, related entity and ID, provider, attempt time, status
(`ATTEMPTING`, `SENT`, `FAILED`, `SKIPPED`, or `UNCONFIGURED`), and provider
error detail. `DeviceToken` stores FCM registrations; invalid tokens are
removed after provider rejection.
