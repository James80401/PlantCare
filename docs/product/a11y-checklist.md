# Accessibility checklist (H2)

> **Navigation:** [improvement-recommendations.md](improvement-recommendations.md) · [uat-checklist.md](uat-checklist.md)

Patterns used across Plant Care web. Re-run this list when adding major UI.

## Global shell

- [x] `lang="en"` on `<html>` (`index.html`)
- [x] **Skip link** → `#main-content` (`SkipLink` in `Layout.tsx`)
- [x] One `<main id="main-content">` per authenticated page
- [x] Desktop nav `aria-label="Main"`; mobile bottom nav `aria-label="Primary"`
- [x] Active routes: `aria-current="page"` on nav links
- [x] Log out button has accessible name

## Forms

- [x] `Input` / `Textarea`: `aria-invalid`, `aria-describedby` for errors and hints
- [x] Errors use `FormError` (`role="alert"`)
- [x] Loading copy uses `StatusMessage` (`role="status"`, `aria-live="polite"`)

## Tasks

- [x] Complete / skip / snooze toggles: `aria-expanded` + `aria-controls`
- [x] Expandable panels: `role="region"` + `aria-label`
- [x] Overdue state: text label, not color alone
- [x] Task checkboxes: `aria-label` with task type and plant name

## Modals

- [x] `role="dialog"` + `aria-modal="true"`
- [x] `aria-labelledby` on task instructions and bottom sheet
- [x] Escape closes dialogs (`useDialogA11y`)
- [x] Initial focus in modal (close button or sheet panel)

## Media

- [x] Plant profile hero image: descriptive `alt`
- [x] Community post images: author in `alt`
- [x] Decorative emoji/icons: `aria-hidden` where redundant with text

## Community & engagement

- [x] Like buttons: `aria-pressed`
- [x] Comment threads: `aria-expanded` / `aria-controls`
- [x] Feed: `section` + post `article` semantics

## Manual QA (each release)

- [ ] Tab through dashboard, plant profile, and tasks — no keyboard traps
- [ ] VoiceOver / NVDA: announce errors when forms fail
- [ ] 200% zoom: no horizontal scroll on dashboard (see UAT e2e)
- [ ] Focus ring visible on buttons and links

## Automated

- [x] Playwright: landmarks + skip link (`tests/e2e/uat.spec.ts`)
- [ ] Optional: `@axe-core/playwright` on `/garden` in CI (add when ready)

## Related components

| Component | Path |
|-----------|------|
| `FormError` | `apps/web/src/components/a11y/FormError.tsx` |
| `StatusMessage` | `apps/web/src/components/a11y/StatusMessage.tsx` |
| `SkipLink` | `apps/web/src/components/a11y/SkipLink.tsx` |
| `useDialogA11y` | `apps/web/src/hooks/useDialogA11y.ts` |
