# Tutorial: One-shot diagnosis

> **Navigation:** [Tutorials INDEX](INDEX.md) · [Diagnosis pipeline](../architecture/diagnosis-pipeline.md) · [Feature availability](../reference/feature-availability.md)

> **Web UI:** There is **no in-app button** to create a one-shot diagnosis today. Use **Swagger** (`POST /api/v1/plants/:id/diagnose`) or API clients. The plant profile only shows **Past diagnoses** if rows already exist in the database.

## API

`POST /api/v1/plants/:plantId/diagnose` with optional photo + symptom text.

## Priority chain

1. **OpenAI** vision + structured JSON
2. **Hugging Face** image hint (if token set)
3. **Rules** keyword library (`diagnosis-advice.ts`)

Results stored as `Diagnosis` rows; shown in **Past diagnoses** on profile when present.

Without API keys, rules-only fallback still returns advice.

## In-app alternative

For interactive help with a UI, use [Dr. Plant chat](using-dr-plant-chat.md) on the plant profile.
