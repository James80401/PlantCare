import { describe, expect, it } from 'vitest';
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildOrganizationJsonLd,
  buildSoftwareApplicationJsonLd,
  buildStructuredData,
} from './structuredData';
import type { MarketingRouteMeta } from './marketingRegistry';
import { readPublicSiteConfig } from './siteConfig';

const launch = readPublicSiteConfig({ VITE_PUBLIC_SITE_MODE: 'launch' });

const nestedRoute: MarketingRouteMeta = {
  path: '/guides/plant-diagnosis-app',
  title: 'Plant Diagnosis App',
  description: 'Diagnose plant problems with AI.',
  h1: 'Plant Diagnosis App',
  structuredData: ['breadcrumb', 'article'],
} as MarketingRouteMeta;

describe('buildOrganizationJsonLd', () => {
  it('produces valid schema.org Organization markup', () => {
    const json = buildOrganizationJsonLd(launch);
    expect(json['@context']).toBe('https://schema.org');
    expect(json['@type']).toBe('Organization');
    expect(json.name).toBe('Dr. Plant');
    expect(json.url).toBe(launch.canonicalBaseUrl);
    expect(json.logo).toBe(`${launch.canonicalBaseUrl}/icons/icon.svg`);
  });
});

describe('buildSoftwareApplicationJsonLd', () => {
  it('produces valid schema.org SoftwareApplication markup with a free offer', () => {
    const json = buildSoftwareApplicationJsonLd(launch);
    expect(json['@type']).toBe('SoftwareApplication');
    expect(json.offers).toEqual({ '@type': 'Offer', price: '0', priceCurrency: 'USD' });
    expect(json.url).toBe(launch.canonicalBaseUrl);
  });
});

describe('buildBreadcrumbJsonLd', () => {
  it('builds one ListItem per path segment plus the home root, in order', () => {
    const json = buildBreadcrumbJsonLd(nestedRoute, launch);
    expect(json['@type']).toBe('BreadcrumbList');
    expect(json.itemListElement).toHaveLength(3);
    expect(json.itemListElement[0]).toEqual({
      '@type': 'ListItem',
      position: 1,
      name: 'Dr. Plant',
      item: `${launch.canonicalBaseUrl}/`,
    });
    expect(json.itemListElement[1].item).toBe(`${launch.canonicalBaseUrl}/guides`);
    expect(json.itemListElement[2]).toEqual({
      '@type': 'ListItem',
      position: 3,
      name: nestedRoute.h1,
      item: `${launch.canonicalBaseUrl}${nestedRoute.path}`,
    });
  });

  it('uses the root Organization item alone for the home route', () => {
    const home: MarketingRouteMeta = { ...nestedRoute, path: '/' };
    const json = buildBreadcrumbJsonLd(home, launch);
    expect(json.itemListElement).toHaveLength(1);
  });
});

describe('buildArticleJsonLd', () => {
  it('produces valid schema.org Article markup with author and publisher', () => {
    const json = buildArticleJsonLd(nestedRoute, launch);
    expect(json['@type']).toBe('Article');
    expect(json.headline).toBe(nestedRoute.title);
    expect(json.description).toBe(nestedRoute.description);
    expect(json.author).toEqual({ '@type': 'Organization', name: 'Dr. Plant' });
    expect(json.mainEntityOfPage).toBe(`${launch.canonicalBaseUrl}${nestedRoute.path}`);
  });
});

describe('buildStructuredData', () => {
  it('maps each structuredData kind on the route to its matching builder, in order', () => {
    const results = buildStructuredData(nestedRoute, launch);
    expect(results).toHaveLength(2);
    expect(results[0]['@type']).toBe('BreadcrumbList');
    expect(results[1]['@type']).toBe('Article');
  });

  it('returns an empty array for a route with no structuredData kinds', () => {
    const bare: MarketingRouteMeta = { ...nestedRoute, structuredData: [] };
    expect(buildStructuredData(bare, launch)).toEqual([]);
  });
});
