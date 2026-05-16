# Tutorial: One-shot diagnosis

> **Navigation:** [Tutorials INDEX](INDEX.md) · [Diagnosis pipeline](../architecture/diagnosis-pipeline.md)

`POST /api/v1/plants/:id/diagnose` with optional photo + symptom text.

## Priority chain

1. **OpenAI** vision + structured JSON
2. **Hugging Face** image hint (if token set)
3. **Rules** keyword library (`diagnosis-advice.ts`)

Results stored as `Diagnosis` rows; shown in **Past diagnoses** on profile.

Without API keys, rules-only fallback still returns advice.
