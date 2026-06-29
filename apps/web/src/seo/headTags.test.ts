import { describe, expect, it } from 'vitest';
import { buildPageHead, injectHeadIntoHtml } from './headTags';
import { marketingRoutes } from './marketingRegistry';
import { readPublicSiteConfig } from './siteConfig';

const launch = readPublicSiteConfig({ VITE_PUBLIC_SITE_MODE: 'launch' });
const privateMode = readPublicSiteConfig({});
const diagnosis = marketingRoutes.find((r) => r.path === '/plant-diagnosis-app')!;

const BASE_HTML = [
  '<!DOCTYPE html><html><head>',
  '<meta name="description" content="default" />',
  '<meta name="robots" content="noindex,nofollow" data-managed="seo-default" />',
  '<title>Default</title>',
  '</head><body><div id="root"></div></body></html>',
].join('\n');

describe('buildPageHead', () => {
  it('is index,follow with structured data on a launch build', () => {
    const head = buildPageHead(diagnosis, diagnosis.path, launch);
    expect(head.robots).toBe('index,follow');
    expect(head.title).toBe(diagnosis.title);
    expect(head.canonical).toBe(`${launch.canonicalBaseUrl}/plant-diagnosis-app`);
    expect(head.og['og:title']).toBe(diagnosis.title);
    expect(head.jsonLd.length).toBeGreaterThan(0);
  });

  it('is noindex in private mode', () => {
    expect(buildPageHead(diagnosis, diagnosis.path, privateMode).robots).toBe('noindex,nofollow');
  });
});

describe('injectHeadIntoHtml', () => {
  it('replaces title/description/robots and injects canonical, OG, and JSON-LD', () => {
    const html = injectHeadIntoHtml(BASE_HTML, buildPageHead(diagnosis, diagnosis.path, launch));
    expect(html).toContain(`<title>${diagnosis.title}</title>`);
    expect(html).toContain('content="index,follow"');
    expect(html).not.toContain('content="noindex,nofollow"');
    expect(html).toContain('rel="canonical"');
    expect(html).toContain('property="og:title"');
    expect(html).toContain('application/ld+json');
    // exactly one robots + one description tag (replaced, not duplicated)
    expect(html.match(/name="robots"/g)).toHaveLength(1);
    expect(html.match(/name="description"/g)).toHaveLength(1);
  });
});
