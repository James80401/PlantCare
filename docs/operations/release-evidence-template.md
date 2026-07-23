# Release evidence template

> Copy this file into the operator-local sign-off location for a release. Do not
> mark a row complete without a command result, artifact, or recorded manual
> observation.

## Identity

| Field | Value |
|---|---|
| Date/time (UTC) | |
| Commit SHA | |
| Branch | `main` |
| Operator | |
| Target | staging / production |
| Previous deployed SHA | |

## Clean verification

| Evidence | Result / artifact |
|---|---|
| Node/npm version | |
| `npm ci` | |
| Typecheck | |
| API tests | |
| Web tests | |
| PostgreSQL integration | |
| Builds | |
| Desktop/mobile E2E | |
| Docs and private/public SEO assertions | |
| Dependency audit review | |
| Feature-flag matrix | |
| Security-header probe | |

## Database and recovery

| Evidence | Result / artifact |
|---|---|
| Pre-deploy schema diff | |
| Migration plan reviewed | |
| Database backup path/checksum | |
| Uploads backup path/checksum | |
| Dump readability check | |
| Latest restore drill date/result | |

## Deployment

| Evidence | Result / artifact |
|---|---|
| Workflow run | |
| Deployed SHA | |
| Migration result | |
| Seed/catalog counts | |
| Container readiness | |
| Non-mutating live sign-off | |
| Rollback rehearsal/result | |

## Mobile and accessibility

| Evidence | Result / artifact |
|---|---|
| Android version code/name | |
| Store preflight | |
| Push preflight | |
| Closed-test install | |
| Viewport matrix | |
| Keyboard/200% zoom | |
| Screen-reader scenario | |

## Decision

- [ ] Release gates pass.
- [ ] Buddy remains gated unless separately approved.
- [ ] Premium billing remains gated unless separately approved.
- [ ] Public indexing remains gated unless separately approved.

Decision/notes:
