# Architecture

> **Navigation:** [Master INDEX](../INDEX.md) · [Application overview](../application-overview.md)

| Document | Topics |
|----------|--------|
| [system-overview.md](system-overview.md) | Layers, boundaries |
| [monorepo.md](monorepo.md) | Workspaces, packages |
| [request-flow.md](request-flow.md) | HTTP → service → DB |
| [auth-and-security.md](auth-and-security.md) | JWT, guards |
| [auth-token-lifecycle.md](auth-token-lifecycle.md) | Token issuance, rotation, grace window, revocation |
| [scheduling.md](scheduling.md) | Task generation rules |
| [care-guide-pipeline.md](care-guide-pipeline.md) | Seed → DB → API → UI |
| [diagnosis-pipeline.md](diagnosis-pipeline.md) | OpenAI → HF → rules |
| [ai-pipeline.md](ai-pipeline.md) | Image flow: upload → moderation → model → persist |
| [decisions/INDEX.md](decisions/INDEX.md) | Architecture Decision Records (ADRs) |

**Implementation:** [API](../api/INDEX.md) · [Web](../web/INDEX.md) · [Database](../database/INDEX.md)
