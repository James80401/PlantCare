# Phase 7 accessibility and Android implementation evidence

> **Date:** 2026-07-23
>
> **Candidate branch:** `codex/phase-6-existing-ux`
>
> **State:** automated implementation gates pass; external/manual evidence remains

## Accessibility implementation

- The shared dialog hook traps focus, restores the invoking focus, closes only
  the top dialog on Escape, locks page scroll, isolates background content, and
  supports nested dialogs and required-choice dialogs.
- Task instructions, task schedule explanation, bottom sheets, Help, Light
  Meter, Buddy discovery, and confirmation flows use the shared dialog
  reference.
- Layout sends focus to the main content region after route/query navigation.
- Automated Help/dialog coverage verifies initial focus, tab wrapping,
  background isolation, Escape, and focus restoration. Layout coverage verifies
  route focus. Existing reduced-motion behavior remains intact.
- The full Playwright run passes 48 enabled desktop/mobile scenarios, including
  route landmarks, grouped task disclosures, snooze controls, Dr. Plant, Add
  Plant, Journal, community, and responsive navigation. Buddy and the
  SMTP-dependent reset flow are deliberately skipped in both projects when
  their gates/configuration are absent.

## Android release path

- Android version is `1.1 (2)`.
- `npm run mobile:release:android` builds the web app with
  `https://api.drplant.app/api/v1`, synchronizes Capacitor, and fails if that URL
  is absent from the generated bundle.
- `npm run mobile:store-check` passes 10/10 locally after the release build.
- CI now uses Node 22 and Java 21 to run the release bundle/sync, store
  preflight, and Gradle `bundleRelease`.
- The `android` job passed in
  [candidate CI run 30063024797](https://github.com/James80401/PlantCare/actions/runs/30063024797),
  including the Java 21 Gradle release bundle.
- The local push preflight passes 4/5. The client Firebase file is present
  locally, but the API FCM service-account tuple or legacy server key is not
  available in the operator environment.

## Evidence still required

- Supply server FCM credentials and record a 5/5 push preflight plus real
  delivery.
- The workstation has no configured JDK, so local Gradle `bundleRelease` cannot
  run; the successful Java 21 CI job is the automated bundle-build authority.
- Generate/sign and upload the AAB through Google Play closed testing, then
  verify login, refresh, upload, Dr. Plant, task actions, notification
  permission/delivery, and deep link on a tester device.
- Record the existing viewport, tablet, 200% zoom, keyboard-only, and
  VoiceOver/NVDA matrix. These are manual observations and are not marked
  complete by automated tests.
