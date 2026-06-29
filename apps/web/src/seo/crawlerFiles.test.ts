import { describe, expect, it } from 'vitest';
import { buildLlmsTxt, buildRobotsTxt, buildSitemapXml, defaultRobotsDirective } from './crawlerFiles';
import { readPublicSiteConfig } from './siteConfig';

const privateConfig = readPublicSiteConfig({});
const teaserNoindex = readPublicSiteConfig({ VITE_PUBLIC_SITE_MODE: 'teaser' });
const launchConfig = readPublicSiteConfig({ VITE_PUBLIC_SITE_MODE: 'launch' });

describe('private mode', () => {
  it('is noindex with an empty sitemap and a global Disallow', () => {
    expect(defaultRobotsDirective(privateConfig)).toBe('noindex,nofollow');
    expect(buildRobotsTxt(privateConfig)).toMatch(/User-agent: \*\nDisallow: \/\n/);
    expect(buildSitemapXml(privateConfig)).not.toContain('<loc>');
    expect(buildLlmsTxt(privateConfig)).toBe('');
  });

  it('disallows every AI crawler', () => {
    const robots = buildRobotsTxt(privateConfig);
    ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'CCBot'].forEach((bot) => {
      expect(robots).toContain(`User-agent: ${bot}\nDisallow: /\n`);
    });
  });
});

describe('teaser (noindex) mode', () => {
  it('keeps AI crawlers and indexing off', () => {
    expect(defaultRobotsDirective(teaserNoindex)).toBe('noindex,nofollow');
    expect(buildRobotsTxt(teaserNoindex)).toContain('User-agent: GPTBot\nDisallow: /\n');
    expect(buildSitemapXml(teaserNoindex)).not.toContain('<loc>');
    expect(buildLlmsTxt(teaserNoindex)).toBe('');
  });
});

describe('launch mode', () => {
  it('is indexable and lists approved marketing routes only', () => {
    expect(defaultRobotsDirective(launchConfig)).toBe('index,follow');
    const sitemap = buildSitemapXml(launchConfig);
    expect(sitemap).toContain('/plant-diagnosis-app');
    expect(sitemap).toContain('/plant-care-guides/pothos');
    expect(sitemap).not.toContain('/garden');
  });

  it('allows answer-engine crawlers but holds training crawlers', () => {
    const robots = buildRobotsTxt(launchConfig);
    // answer engines: own group that disallows app paths but allows the rest
    ['GPTBot', 'ClaudeBot', 'PerplexityBot'].forEach((bot) => {
      expect(robots).toContain(`User-agent: ${bot}\nDisallow: /admin`);
    });
    // training/bulk crawlers stay fully disallowed until an explicit decision
    ['Google-Extended', 'CCBot'].forEach((bot) => {
      expect(robots).toContain(`User-agent: ${bot}\nDisallow: /\n`);
    });
  });

  it('publishes an llms.txt with the canonical base and key pages', () => {
    const llms = buildLlmsTxt(launchConfig);
    expect(llms).toContain('# Dr. Plant');
    expect(llms).toContain(`${launchConfig.canonicalBaseUrl}/plant-diagnosis-app`);
  });
});
