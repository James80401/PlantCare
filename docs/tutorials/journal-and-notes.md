# Tutorial: Journal and notes

> **Navigation:** [Tutorials INDEX](INDEX.md) · [API journal](../api/journal.md)

## Journal (profile)

1. Plant profile → **Journal** section
2. Add note → `POST /plants/:plantId/journal`
3. Entries listed with timestamp

Optional photo on create (multipart).

## Plant notes field

`notes` on plant can be set at create time (`POST /plants`). Displayed in care overview **Your notes** section when present.

Future: edit notes on profile via PATCH (field supported in API DTO).
