import { describe, expect, it } from 'vitest';
import {
  readPublicSiteConfig,
  shouldRenderMarketingRoutes,
  canonicalUrl,
} from './siteConfig';
import { buildRobotsTxt, buildSitemapXml, defaultRobotsDirective } from './crawlerFiles';
import { findMarketingRoute, indexableMarketingRoutes, isAuthOrProtectedPath } from './marketingRegistry';

describe('public site SEO gates', () => {
  it('defaults to strict private mode with no indexable marketing routes', () => {
    const config = readPublicSiteConfig({});

    expect(config.mode).toBe('private');
    expect(config.marketingIndexable).toBe(false);
    expect(shouldRenderMarketingRoutes(config)).toBe(false);
    expect(indexableMarketingRoutes(config)).toHaveLength(0);
    expect(defaultRobotsDirective(config)).toBe('noindex,nofollow');
    expect(buildSitemapXml(config)).not.toContain('<url>');
  });

  it('allows local or protected marketing preview without indexing it', () => {
    const config = readPublicSiteConfig({
      VITE_ENABLE_MARKETING_PREVIEW: 'true',
    });

    expect(shouldRenderMarketingRoutes(config)).toBe(true);
    expect(indexableMarketingRoutes(config)).toHaveLength(0);
    expect(defaultRobotsDirective(config)).toBe('noindex,nofollow');
  });

  it('keeps teaser mode unindexed unless marketing indexing is explicitly enabled', () => {
    const hiddenTeaser = readPublicSiteConfig({ VITE_PUBLIC_SITE_MODE: 'teaser' });
    const indexedTeaser = readPublicSiteConfig({
      VITE_PUBLIC_SITE_MODE: 'teaser',
      VITE_MARKETING_INDEXABLE: 'true',
    });

    expect(indexableMarketingRoutes(hiddenTeaser)).toHaveLength(0);
    expect(indexableMarketingRoutes(indexedTeaser).map((route) => route.path)).toEqual([
      '/',
      '/waitlist',
    ]);
  });

  it('indexes approved launch routes and excludes protected app paths', () => {
    const config = readPublicSiteConfig({ VITE_PUBLIC_SITE_MODE: 'launch' });
    const paths = indexableMarketingRoutes(config).map((route) => route.path);
    const sitemap = buildSitemapXml(config);
    const robots = buildRobotsTxt(config);

    expect(paths).toContain('/plant-diagnosis-app');
    expect(paths).toContain('/plant-care-guides/pothos');
    expect(paths).not.toContain('/login');
    expect(sitemap).toContain('https://drplant.app/plant-problems/yellow-leaves');
    expect(robots).toContain('Disallow: /garden');
    expect(defaultRobotsDirective(config)).toBe('index,follow');
  });

  it('normalizes canonicals and protected path detection', () => {
    const config = readPublicSiteConfig({
      VITE_PUBLIC_SITE_MODE: 'launch',
      VITE_CANONICAL_BASE_URL: 'https://example.com/',
    });

    expect(canonicalUrl('/plant-care-app', config)).toBe('https://example.com/plant-care-app');
    expect(findMarketingRoute('/plant-care-guides/pothos/')?.kind).toBe('species');
    expect(isAuthOrProtectedPath('/garden/plants/abc/health')).toBe(true);
    expect(isAuthOrProtectedPath('/plant-problems/root-rot')).toBe(false);
  });
});
