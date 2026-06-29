# Mobile viewport QA checklist

> Navigation: [uat-checklist.md](uat-checklist.md) | [a11y-checklist.md](a11y-checklist.md) | [google-play-closed-testing.md](google-play-closed-testing.md)

Use this pass before a mobile web release, Play closed testing build, or any change to global layout, fixed bars, plant profile tabs, task rows, Dr. Plant, or journal media.

## Viewports

- [ ] 360 x 740: small Android baseline.
- [ ] 390 x 844: common iPhone baseline.
- [ ] 430 x 932: large phone baseline.
- [ ] 768 x 1024: tablet portrait.
- [ ] 1024 x 768: tablet landscape.

## Global shell

- [ ] Bottom navigation shows five stable tap targets: Home, Gardens, Browse, Tips, More.
- [ ] More menu opens above the bottom nav, stays within the viewport, and scrolls if content is taller than the screen.
- [ ] Admin, Settings, Add plant, Tasks, Calendar, Buddy, Household, Score, and Upgrade routes remain reachable from More when applicable.
- [ ] Fixed bottom navigation does not cover primary actions, form submit buttons, or final list rows.
- [ ] Safe-area padding works on devices with notches or gesture bars.
- [ ] Header content truncates instead of pushing controls off screen.

## Core flows

- [ ] Dashboard cards, empty states, loading states, and error states fit without horizontal scroll.
- [ ] Plant profile hero image, action buttons, summary tiles, and sticky tabs remain usable with long plant names.
- [ ] Plant profile tabs scroll horizontally and do not hide under the sticky header.
- [ ] Health tab Dr. Plant shortcut clears the global bottom nav and jumps to the chat block.
- [ ] Task care-round headers, expand controls, and Done buttons remain at least 44 px tall.
- [ ] Journal form controls, file input, photo comparison, and timeline actions fit at phone width.
- [ ] Modals and bottom sheets leave visible close/action controls after keyboard or viewport changes.

## Accessibility and input

- [ ] Touch targets for nav, task actions, tab buttons, and form submits are at least 44 px tall.
- [ ] Focus rings are visible when tabbing with a keyboard.
- [ ] Text remains readable at 200% browser zoom.
- [ ] Important status is conveyed with text, not color alone.
- [ ] Screen reader labels identify nav landmarks and active routes.

## Automated evidence

- [x] `apps/web/src/components/Layout.test.tsx` guards the five-slot mobile nav and More menu reachability.
- [x] `tests/e2e/uat.spec.ts` includes mobile smoke coverage for bottom navigation and safe content clearance.
- [ ] Run `npm run uat:e2e` before release when the local or target environment is available.
- [ ] Run `npm run mobile:store-check` before generating a Play testing build.
