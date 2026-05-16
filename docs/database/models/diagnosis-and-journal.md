# Models: Diagnosis, journal, notifications

> **Navigation:** [Models INDEX](INDEX.md)

## Diagnosis

One-shot: `resultLabel`, `confidence`, `adviceText`, `detailJson`, `source`.

## DiagnosisConversation / DiagnosisMessage

Chat threads per plant; messages have `role` (user/assistant), `content`, optional image URL.

## JournalEntry

`notes`, optional `photoUrl`, `plantId`.

## NotificationLog / DeviceToken

Audit trail for sent reminders; FCM/device registration for push.
