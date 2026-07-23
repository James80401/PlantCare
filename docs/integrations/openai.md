# OpenAI integration

> **Navigation:** [Integrations INDEX](INDEX.md)

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1-mini
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_TIMEOUT_MS=60000
OPENAI_MAX_RETRIES=2
```

**Uses:** `LlmDiagnosisService`, `DiagnosisChatService`

**Features:** Vision on plant photos, structured diagnosis JSON, multi-turn chat.

**Errors:** 429/quota → HTTP 503 via `openai-errors.ts`

Test: `npm run test:integrations`
