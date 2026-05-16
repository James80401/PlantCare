# Models: Species and care guides

> **Navigation:** [Models INDEX](INDEX.md)

## PlantSpecies

`commonName`, `scientificName`, `wateringFreqDays`, `sunlight`, `toxicity`, `phMin`/`phMax`, `careNotes`, optional `perenualId`.

## CareGuide

`id`, `taskType`, optional `speciesId`, `title`, `summary`, `sectionsJson` (array of sections with optional `imageKeys`).

## CareGuideImage

`imageKey`, `caption`, `altText`, `sortOrder` — keys map to SVG or `photo-*` JPEGs.
