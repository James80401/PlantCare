import { describe, expect, it } from 'vitest';
import { marketingRoutes, problemGuides, speciesGuides } from './marketingRegistry';

describe('marketing registry - cannibalization control', () => {
  it('gives every route a non-empty primary keyword', () => {
    marketingRoutes.forEach((route) => {
      expect(route.primaryKeyword, route.path).toBeTruthy();
    });
  });

  it('never lets two routes own the same primary keyword', () => {
    const keywords = marketingRoutes.map((route) => route.primaryKeyword.trim().toLowerCase());
    const duplicates = keywords.filter((kw, index) => keywords.indexOf(kw) !== index);
    expect(duplicates).toEqual([]);
    expect(new Set(keywords).size).toBe(marketingRoutes.length);
  });

  it('keeps each route path unique', () => {
    const paths = marketingRoutes.map((route) => route.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('uses a raster social image for scraper compatibility', () => {
    marketingRoutes.forEach((route) => {
      expect(route.socialImage, route.path).toMatch(/\.(png|jpe?g|webp)$/);
    });
  });

  it('keeps problem guides launch-quality enough for detailed pages', () => {
    problemGuides.forEach((guide) => {
      expect(guide.overview, guide.slug).toBeTruthy();
      expect(guide.checks.length, guide.slug).toBeGreaterThanOrEqual(3);
      expect(guide.likelyCauses.length, guide.slug).toBeGreaterThanOrEqual(3);
      expect(guide.recovery.length, guide.slug).toBeGreaterThanOrEqual(3);
      expect(guide.mistakesToAvoid.length, guide.slug).toBeGreaterThanOrEqual(3);
      expect(guide.whenToAskForHelp.length, guide.slug).toBeGreaterThanOrEqual(3);
      expect(guide.drPlantPrompt, guide.slug).toMatch(/Dr\. Plant/);
      expect(guide.relatedLinks.length, guide.slug).toBeGreaterThanOrEqual(2);
    });
  });

  it('keeps species guides launch-quality enough for detailed pages', () => {
    const problemSlugs = new Set(problemGuides.map((guide) => guide.slug));

    speciesGuides.forEach((guide) => {
      expect(guide.light, guide.slug).toBeTruthy();
      expect(guide.watering, guide.slug).toBeTruthy();
      expect(guide.firstWeek.length, guide.slug).toBeGreaterThanOrEqual(3);
      expect(guide.careRhythm.length, guide.slug).toBeGreaterThanOrEqual(3);
      expect(guide.beginnerRisks.length, guide.slug).toBeGreaterThanOrEqual(3);
      expect(guide.symptomsToWatch.length, guide.slug).toBeGreaterThanOrEqual(3);
      expect(guide.relatedProblemSlugs.length, guide.slug).toBeGreaterThanOrEqual(2);
      guide.relatedProblemSlugs.forEach((slug) => expect(problemSlugs.has(slug), guide.slug).toBe(true));
      expect(guide.petSafetyNote, guide.slug).toMatch(/ASPCA|veterinarian|local expert/);
    });
  });
});
