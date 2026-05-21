# Tutorial: Journal and notes

> **Navigation:** [Tutorials INDEX](INDEX.md) · [API journal](../api/journal.md) · [Feature availability](../reference/feature-availability.md)

## Journal on plant profile (web)

1. Open **/garden/plants/:id**
2. Scroll to the **Journal** section
3. Type a note in the text field and save — text-only in the current web app
4. Entries appear with a timestamp

## API-only (not in web UI yet)

| Capability | API | Web |
|------------|-----|-----|
| Journal entry with photo | `POST /plants/:plantId/journal` (multipart) | No file upload on profile |
| Plant `notes` at create | `POST /plants` body field | Add Plant form has no notes field |

Use Swagger or API clients for photo journal entries and plant notes until the web app adds those fields.

Future: edit notes on profile via PATCH (supported in API DTO).
