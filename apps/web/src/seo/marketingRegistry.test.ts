import { describe, expect, it } from 'vitest';
import { marketingRoutes } from './marketingRegistry';

describe('marketing registry — cannibalization control', () => {
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
});
