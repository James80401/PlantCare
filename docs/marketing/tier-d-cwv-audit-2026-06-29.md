# Tier D CWV Audit - 2026-06-29

Local launch-mode preview audit for the Dr. Plant pre-launch marketing pages. This was run against
`http://127.0.0.1:4173` after a local `VITE_PUBLIC_SITE_MODE=launch` build. Production was not put
into launch mode.

## Commands

```bash
VITE_PUBLIC_SITE_MODE=launch npm run build -w @plant-care/web
npm run preview -w @plant-care/web -- --host 127.0.0.1 --port 4173 --strictPort
npx lighthouse <url> --only-categories=performance --form-factor=mobile --screenEmulation.mobile=true
```

## Result

| Route | Lighthouse mobile performance | LCP | CLS | TBT | Speed Index |
|---|---:|---:|---:|---:|---:|
| `/` | 96 | 2,413 ms | 0.000 | 0 ms | 1,959 ms |
| `/plant-problems/yellow-leaves` | 96 | 2,258 ms | 0.002 | 0 ms | 2,182 ms |
| `/plant-care-guides/pothos` | 95 | 2,411 ms | 0.010 | 0 ms | 2,184 ms |

## Notes

- Initial landing-page LCP was about 3,064 ms. Lighthouse identified the hero summary text as the
  LCP element and flagged the Google Fonts stylesheet as render-blocking.
- `apps/web/index.html` now preloads the Google Fonts stylesheet and applies it asynchronously with
  a `noscript` fallback. After that change, all audited routes met the Tier D lab targets.
- Lighthouse lab data does not produce real field INP. TBT was 0 ms on the audited routes, which is
  the Lighthouse lab proxy to watch until field INP exists after launch/open testing.
- Lighthouse produced JSON reports but emitted Windows temp-profile cleanup warnings after Chrome
  exited. The report files were still written and parsed successfully.
