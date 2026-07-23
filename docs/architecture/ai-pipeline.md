# AI image pipeline

> **Navigation:** [Architecture INDEX](INDEX.md) · [Diagnosis pipeline](diagnosis-pipeline.md) · [AI cost & usage](../operations/ai-cost-and-usage.md) · [Integrations: OpenAI](../integrations/openai.md)

How an uploaded photo travels from the HTTP boundary to a stored result, and every
gate it passes through. Covers identification, one-shot diagnosis, Dr. Plant chat,
journal photos, and plant photos — all of which share the same front-door guards.

---

## End-to-end flow

```
            multipart/form-data (image)
                      │
        ┌─────────────▼──────────────┐
        │ 1. Multer file gate         │  imageUploadOptions
        │    size ≤ 10 MB             │  apps/api/src/common/upload-options.ts
        │    MIME ∈ {jpeg,png,webp,   │  → 400 on violation
        │    gif,heic,heif}           │
        └─────────────┬──────────────┘
                      │ (buffer in memory)
        ┌─────────────▼──────────────┐
        │ 2. Image moderation         │  ImageModerationService
        │    isPlant? isExplicit?     │  apps/api/src/common/image-moderation.service.ts
        │    (OpenAI vision, 1 call)  │  → 400 on reject, audit-logged
        └─────────────┬──────────────┘
                      │ allowed
        ┌─────────────▼──────────────┐
        │ 3. Feature-specific model   │
        │    • identify → PlantNet    │  plantnet.service.ts (min-confidence floor)
        │    • diagnose → HF + OpenAI │  diagnosis.service.ts (moderation runs in parallel)
        │    • chat     → OpenAI      │  diagnosis-chat.service.ts
        └─────────────┬──────────────┘
                      │
        ┌─────────────▼──────────────┐
        │ 4. Persist + save image     │  upload.service.ts (managed disk) + Prisma
        └─────────────────────────────┘
```

The text-only AI surfaces (Dr. Plant chat, diagnosis) add a **scope gate** and a
**rate/abuse gate** on top of this — see [AI cost & usage](../operations/ai-cost-and-usage.md).

---

## 1. Multer file gate

Every image route binds `FileInterceptor(field, imageUploadOptions)`. The shared
options ([`upload-options.ts`](../../apps/api/src/common/upload-options.ts)) enforce:

- **Size:** `MAX_IMAGE_UPLOAD_BYTES = 10 MB` (`limits.fileSize`)
- **Type:** `fileFilter` allows only `image/jpeg|png|webp|gif|heic|heif`; anything
  else is rejected with `BadRequestException` before the handler runs.

Routes covered: `POST /plants/identify`, `POST /plants/upload`,
`POST /plants/:id/diagnose`, the two `…/diagnose/conversations` upload routes, and
both journal routes.

## 2. Image moderation

[`ImageModerationService.assertImageAllowed(file, ctx)`](../../apps/api/src/common/image-moderation.service.ts)
sends the image to an OpenAI vision model (`OPENAI_MODERATION_MODEL`, default
`gpt-4o-mini`) and parses a strict JSON verdict:

```jsonc
{ "isPlant": true, "isExplicit": false, "confidence": 0.95, "reason": "…" }
```

- `isExplicit: true` → **reject** (nudity, sexual content, gore, etc.)
- `isPlant: false` → **reject** (not a plant subject)
- otherwise → allowed, returns the verdict

**Fail-open by design.** If the API key is unset, the request errors out, or the
response is unparseable, moderation returns an *allow* verdict rather than blocking
the user. Rationale: a moderation outage must not lock legitimate users out of
uploading plant photos. Every fail-open path is logged at `error`/`warn`. See
[ADR-0001](decisions/0001-fail-open-image-moderation.md).

**Audit trail.** Every reject emits a single-line structured warn so rejections are
greppable and trackable for regressions:

```
{"event":"image_moderation_reject","reject":"not_plant","feature":"identify",
 "userId":"…","filename":"…","sizeBytes":…,"mime":"…","verdictConfidence":0.9,"reason":"…"}
```

`feature` is one of `identify`, `plant_upload`, `diagnose`, `dr_plant_chat`,
`journal_create`, `journal_update`.

## 3. Feature-specific model calls

### Identify — PlantNet
[`PlantNetService.identify`](../../apps/api/src/plants/plantnet.service.ts) posts the
buffer to PlantNet. Results below `PLANTNET_MIN_CONFIDENCE` (default `0.10`,
configurable) are dropped and surfaced to the user as "could not identify" rather
than shown as a low-confidence guess. With no `PLANTNET_API_KEY`, a demo stub result
is returned.

### One-shot diagnosis — HuggingFace + OpenAI (parallelized)
[`DiagnosisService.diagnose`](../../apps/api/src/diagnosis/diagnosis.service.ts) runs
moderation **concurrently** with the HuggingFace classifier and the OpenAI structured
diagnosis call, so total latency is `max(moderation, model)` instead of the sum:

```
moderation ─┐
HF classify ─┼─ Promise.all ─→ structured diagnosis
OpenAI ─────┘
```

If moderation rejects, its rejection propagates out of the `Promise.all` and the
handler throws **before** the image is written to disk or any `Diagnosis` row is
created. (The in-flight HF/OpenAI calls may still complete and bill for those tokens —
an accepted trade-off since rejections are rare relative to total volume.)

The model chain degrades gracefully: OpenAI structured result → HuggingFace label →
keyword rules (`diagnosis-advice.ts`). See [Diagnosis pipeline](diagnosis-pipeline.md).

### Dr. Plant chat — OpenAI
[`DiagnosisChatService.sendMessage`](../../apps/api/src/diagnosis/diagnosis-chat.service.ts)
moderates an attached image, then sends the **last 20 turns** of history (capped to
protect the context window and token cost) to OpenAI.

## 4. Persist

After all gates pass, [`UploadService.saveFile`](../../apps/api/src/upload/upload.service.ts)
decodes, normalizes, and writes the image to the managed local upload volume, and
the feature row is created in the database. The production volume is included in
the backup and restore process.

---

## Configuration

| Variable | Default | Effect |
|----------|---------|--------|
| `OPENAI_API_KEY` | — | Enables moderation, diagnosis, chat. Unset ⇒ moderation fails open. |
| `OPENAI_MODERATION_MODEL` | `gpt-4o-mini` | Vision model used for the moderation verdict. |
| `OPENAI_MODEL` | `gpt-4.1-mini` | Model for diagnosis/chat generation. |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | Override for proxies/compatible gateways. |
| `HF_API_TOKEN` | — | Enables the HuggingFace disease classifier hint. |
| `PLANTNET_API_KEY` | — | Enables real identification (else demo stub). |
| `PLANTNET_MIN_CONFIDENCE` | `0.10` | Floor below which an identification is rejected. |

Full table: [environment-variables.md](../reference/environment-variables.md).

---

## Testing

- `image-moderation.service.spec.ts` — verdict handling, fail-open paths, audit log.
- `plantnet.service.spec.ts` — confidence threshold + demo fallback.
- `diagnosis.service.spec.ts` — moderation/model parallelization, reject-before-persist.
- `scripts/smoke-image-moderation.mjs` — live OpenAI smoke over real fixtures
  (plant photos pass, tool-only/UI images reject). Run:
  `node scripts/smoke-image-moderation.mjs [--image=/path.jpg]`.
