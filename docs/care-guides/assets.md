# Care guide assets

> **Navigation:** [Care guides INDEX](INDEX.md)

## SVG diagrams

`apps/api/src/care-guides/images/*.svg` — served at `/care-guides/images/`

## Photos

`apps/api/src/care-guides/photos/*.jpg` — optional; keys `photo-*`

## Build

`npm run build` (api) runs `copy-care-guide-assets.mjs` → `dist/care-guides/`

## Optional download

`node apps/api/scripts/download-care-guide-photos.mjs` — uses `prisma/data/care-guide-photo-sources.json`

Attribution: `apps/api/src/care-guides/photos/ATTRIBUTION.md`
