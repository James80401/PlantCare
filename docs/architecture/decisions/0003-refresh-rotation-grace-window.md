# ADR-0003 — 10s grace window on refresh-token rotation

> **Navigation:** [ADR INDEX](INDEX.md) · [Auth token lifecycle](../auth-token-lifecycle.md)

**Status:** Accepted · **Date:** 2026-06

## Context

Refresh tokens are rotated on every use and tracked in families to detect theft: if a
token that was already rotated away is presented again, the whole family is revoked
(see [Auth token lifecycle](../auth-token-lifecycle.md)).

Strict reuse detection has a false-positive failure mode. Legitimate clients can fire
two `/auth/refresh` calls with the *same* token nearly simultaneously:

- a flaky-network retry of a refresh request, or
- two app instances (web + installed mobile) restoring a session at once.

Both pass the "not yet revoked" check, both rotate, and the next use of either sibling
token trips reuse detection — logging out a real, honest user.

## Decision

Add a **10-second grace window** (`REFRESH_ROTATION_GRACE_MS`). A token revoked less
than 10s ago **and** already pointing at a replacement (`replacedBy` set) is treated as
an in-flight concurrent refresh: issue a fresh sibling token instead of revoking the
family. Log a warning so genuine anomalies stay visible. Outside the window, reuse
still revokes the family.

## Consequences

- Eliminates spurious logouts from concurrent/retried refreshes — the common real-world
  case — without meaningfully weakening theft protection.
- A stolen token replayed **within 10s** of a legitimate rotation would be tolerated.
  This is a narrow window and a deliberate trade against the much more frequent
  false-positive logout. Outside 10s, full family revocation still applies.
- The window is a constant; if abuse patterns ever warrant it, make it configurable or
  shorten it.
