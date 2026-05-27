# Tutorial: Journal and notes

> **Navigation:** [Tutorials INDEX](INDEX.md) · [API journal](../api/journal.md) · [Feature availability](../reference/feature-availability.md)

## Journal on plant profile (web)

1. Open **/garden/plants/:id** → **Journal** tab
2. Add **notes**, optional **measurements**, and/or a **progress photo**
3. Photo-only entries are supported (notes optional when a photo is attached)
4. Use **Compare growth photos** when you have two or more photo entries
5. **Edit** or **Delete** from the timeline (delete asks for confirmation)

## API

| Capability | API | Web |
|------------|-----|-----|
| Journal with photo | `POST /plants/:plantId/journal` (multipart) | Journal tab |
| Photo-only create | Same | Journal tab |
| Update / remove photo | `PATCH .../journal/:id` with `removePhoto=true` | Remove photo when editing |
| Plant `notes` at create | `POST /plants` body field | Add Plant wizard |
