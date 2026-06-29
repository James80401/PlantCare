import { isMarketingRouteIndexable, type MarketingRouteMeta } from './marketingRegistry';
import { buildStructuredData } from './structuredData';
import { canonicalUrl, type PublicSiteConfig } from './siteConfig';

export const DEFAULT_TITLE = 'Dr. Plant - Private Plant Care Preview';
export const DEFAULT_DESCRIPTION =
  'Dr. Plant is a private pre-launch plant care assistant for houseplant diagnosis, reminders, and recovery routines.';

export interface PageHead {
  title: string;
  description: string;
  canonical: string;
  robots: string;
  og: Record<string, string>;
  twitter: Record<string, string>;
  jsonLd: unknown[];
}

/**
 * Single source of truth for a page's `<head>`. Used both by Seo.tsx (applies it
 * to the DOM at runtime) and by the build-time prerender in vite.config.ts (emits
 * it into the static HTML), so the two can never drift.
 */
export function buildPageHead(
  route: MarketingRouteMeta | null,
  pathname: string,
  config: PublicSiteConfig,
): PageHead {
  const isIndexable = route ? isMarketingRouteIndexable(route, config) : false;
  const title = route?.title ?? DEFAULT_TITLE;
  const description = route?.description ?? DEFAULT_DESCRIPTION;
  const canonical = canonicalUrl(route?.path ?? pathname, config);
  const socialImage = route?.socialImage ? canonicalUrl(route.socialImage, config) : undefined;
  const isArticle = route?.structuredData.includes('article') ?? false;

  const og: Record<string, string> = {
    'og:title': title,
    'og:description': description,
    'og:url': canonical,
    'og:site_name': 'Dr. Plant',
    'og:type': isArticle ? 'article' : 'website',
  };
  if (socialImage) og['og:image'] = socialImage;

  const twitter: Record<string, string> = {
    'twitter:card': socialImage ? 'summary_large_image' : 'summary',
    'twitter:title': title,
    'twitter:description': description,
  };
  if (socialImage) twitter['twitter:image'] = socialImage;

  return {
    title,
    description,
    canonical,
    robots: isIndexable ? 'index,follow' : 'noindex,nofollow',
    og,
    twitter,
    jsonLd: route ? buildStructuredData(route, config) : [],
  };
}

function escapeAttr(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeText(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Serialize the non-title/description/robots head tags (canonical, OG, Twitter, JSON-LD). */
export function renderHeadTagsHtml(head: PageHead): string {
  const lines: string[] = [`<link rel="canonical" href="${escapeAttr(head.canonical)}" />`];
  for (const [property, content] of Object.entries(head.og)) {
    lines.push(`<meta property="${property}" content="${escapeAttr(content)}" />`);
  }
  for (const [name, content] of Object.entries(head.twitter)) {
    lines.push(`<meta name="${name}" content="${escapeAttr(content)}" />`);
  }
  for (const item of head.jsonLd) {
    // Escape `<` so JSON can't break out of the script element.
    const json = JSON.stringify(item).replace(/</g, '\\u003c');
    lines.push(`<script type="application/ld+json" data-dr-plant-seo="json-ld">${json}</script>`);
  }
  return lines.join('\n    ');
}

/**
 * Produce a route-specific copy of the built index.html: replace the default
 * title/description/robots and inject canonical, OG, Twitter, and JSON-LD before
 * `</head>`. Pure string work; safe to call from the Vite build.
 */
export function injectHeadIntoHtml(baseHtml: string, head: PageHead): string {
  return baseHtml
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeText(head.title)}</title>`)
    .replace(
      /<meta name="description"[^>]*>/,
      `<meta name="description" content="${escapeAttr(head.description)}" />`,
    )
    .replace(
      /<meta name="robots"[^>]*>/,
      `<meta name="robots" content="${head.robots}" data-managed="seo-default" />`,
    )
    .replace('</head>', `    ${renderHeadTagsHtml(head)}\n  </head>`);
}
