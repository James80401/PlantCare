# Architecture Decision Records

> **Navigation:** [Architecture INDEX](../INDEX.md)

ADRs capture **why** a non-obvious choice was made, so a future reader (human or AI)
doesn't undo it without understanding the trade-off. Each record is short: context,
decision, consequences.

| # | Decision | Status |
|---|----------|--------|
| [0001](0001-fail-open-image-moderation.md) | Image moderation fails open | Accepted |
| [0002](0002-beta-premium-gating.md) | Premium limits intentionally ungated in beta | Accepted |
| [0003](0003-refresh-rotation-grace-window.md) | 10s grace window on refresh-token rotation | Accepted |
| [0004](0004-in-memory-dedup-and-cache.md) | In-memory dedup + TTL cache (single-instance) | Accepted |
| [0005](0005-readiness-vs-liveness.md) | Separate readiness and liveness health checks | Accepted |
| [0006](0006-observability-baseline.md) | On-box observability baseline, optional Sentry | Accepted |

## Format

Copy an existing file. Keep it to: **Context** (forces at play), **Decision** (what we
chose), **Consequences** (what this costs / enables, and when to revisit).
