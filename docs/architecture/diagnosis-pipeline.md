# Diagnosis pipeline

> **Navigation:** [Architecture INDEX](INDEX.md) · [API diagnosis](../api/diagnosis.md)

## One-shot (`DiagnosisService`)

OpenAI (`LlmDiagnosisService`) → HF hint → rules (`diagnosis-advice.ts`)

## Chat (`DiagnosisChatService`)

Multi-turn; requires OpenAI. Stores `DiagnosisConversation` + `DiagnosisMessage`.

## Errors

`openai-errors.ts` maps quota/rate limits to HTTP 503 for clients.
