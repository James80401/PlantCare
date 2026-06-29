import type { MarketingRouteMeta } from './marketingRegistry';
import { canonicalUrl, type PublicSiteConfig } from './siteConfig';

function routeNameFromPath(path: string) {
  if (path === '/') return 'Dr. Plant';
  return path
    .split('/')
    .filter(Boolean)
    .map((part) =>
      part
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
    )
    .join(' / ');
}

export function buildOrganizationJsonLd(config: PublicSiteConfig) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Dr. Plant',
    url: config.canonicalBaseUrl,
    logo: canonicalUrl('/icons/icon.svg', config),
    sameAs: [],
  };
}

export function buildSoftwareApplicationJsonLd(config: PublicSiteConfig) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Dr. Plant',
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web, iOS, Android',
    url: config.canonicalBaseUrl,
    description:
      'AI plant diagnosis, beginner houseplant care routines, reminders, and recovery guidance.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };
}

export function buildBreadcrumbJsonLd(route: MarketingRouteMeta, config: PublicSiteConfig) {
  const segments = route.path.split('/').filter(Boolean);
  const items = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Dr. Plant',
      item: canonicalUrl('/', config),
    },
  ];

  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    items.push({
      '@type': 'ListItem',
      position: index + 2,
      name: route.path === currentPath ? route.h1 : routeNameFromPath(currentPath),
      item: canonicalUrl(currentPath, config),
    });
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}

export function buildArticleJsonLd(route: MarketingRouteMeta, config: PublicSiteConfig) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: route.title,
    description: route.description,
    author: {
      '@type': 'Organization',
      name: 'Dr. Plant',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Dr. Plant',
      logo: {
        '@type': 'ImageObject',
        url: canonicalUrl('/icons/icon.svg', config),
      },
    },
    mainEntityOfPage: canonicalUrl(route.path, config),
  };
}

export function buildStructuredData(route: MarketingRouteMeta, config: PublicSiteConfig) {
  return route.structuredData.map((kind) => {
    if (kind === 'organization') return buildOrganizationJsonLd(config);
    if (kind === 'softwareApplication') return buildSoftwareApplicationJsonLd(config);
    if (kind === 'article') return buildArticleJsonLd(route, config);
    return buildBreadcrumbJsonLd(route, config);
  });
}
