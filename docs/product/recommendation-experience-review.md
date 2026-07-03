# Recommendation experience review

> **Status:** first UX review implemented 2026-07-03  
> **Navigation:** [Core UX/a11y pass plan](core-ux-a11y-pass-plan.md) | [Current feature implementation plan](current-feature-implementation-plan.md) | [Recommendations API](../api/recommendations.md)

This note records the first focused review of durable recommendations. The goal
is to keep optional guidance useful without making it feel like urgent care.

## Review summary

| Area | Finding | Resolution |
|------|---------|------------|
| Task conversion | Task-backed recommendations could become tasks from one click. | Added inline confirmation before calling task conversion. |
| Status feedback | Recommendation success/error feedback was visible but not explicitly announced. | Status now uses polite live-region semantics; errors use alerts. |
| Mobile actions | Recommendation actions were compact and could feel cramped. | Primary action buttons now use taller tap targets. |
| Dr. Plant drafts | Action cards were already explicit, but labels were generic. | Draft labels and success copy now distinguish optional recommendations from due tasks. |
| Cadence | Current generator cadence is conservative and matches prior product decisions. | No cadence change in this pass. |

## Current behavior

- Recommendations remain non-critical guidance on the dashboard and plant
  profile.
- Done, Remind tomorrow, and Dismiss remain one-tap lifecycle actions.
- Create task opens a confirmation panel before a task is created.
- Dr. Plant action cards remain drafts until the user confirms.
- Existing analytics events still track views, lifecycle actions, and confirmed
  task conversion.

## Deferred follow-up

- Review analytics after enough private/open-testing usage to tune cadence and
  placement.
- Consider richer confirmation flows only if a recommendation type starts
  producing higher-risk task conversions.
- Revisit recommendation card density during the broader mobile UX pass.
