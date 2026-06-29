import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  findMarketingRoute,
  isAuthOrProtectedPath,
  isMarketingRouteIndexable,
} from './marketingRegistry';
import { buildStructuredData } from './structuredData';
import { canonicalUrl, publicSiteConfig } from './siteConfig';
import { trackEvent } from '../utils/analytics';

const DEFAULT_TITLE = 'Dr. Plant - Private Plant Care Preview';
const DEFAULT_DESCRIPTION =
  'Dr. Plant is a private pre-launch plant care assistant for houseplant diagnosis, reminders, and recovery routines.';

function setMetaByName(name: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function setMetaByProperty(property: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('property', property);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function setCanonical(href: string) {
  let tag = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', 'canonical');
    document.head.appendChild(tag);
  }
  tag.setAttribute('href', href);
}

function setJsonLd(items: unknown[]) {
  document.head.querySelectorAll('script[data-dr-plant-seo="json-ld"]').forEach((node) => {
    node.remove();
  });

  items.forEach((item) => {
    const tag = document.createElement('script');
    tag.type = 'application/ld+json';
    tag.dataset.drPlantSeo = 'json-ld';
    tag.text = JSON.stringify(item);
    document.head.appendChild(tag);
  });
}

export function Seo() {
  const location = useLocation();

  useEffect(() => {
    const route = findMarketingRoute(location.pathname);
    const isIndexable = route ? isMarketingRouteIndexable(route, publicSiteConfig) : false;
    const title = route?.title ?? (isAuthOrProtectedPath(location.pathname) ? DEFAULT_TITLE : DEFAULT_TITLE);
    const description = route?.description ?? DEFAULT_DESCRIPTION;
    const url = canonicalUrl(route?.path ?? location.pathname, publicSiteConfig);
    const socialImage = route?.socialImage ? canonicalUrl(route.socialImage, publicSiteConfig) : undefined;

    document.title = title;
    setMetaByName('description', description);
    setMetaByName('robots', isIndexable ? 'index,follow' : 'noindex,nofollow');
    setCanonical(url);

    setMetaByProperty('og:title', title);
    setMetaByProperty('og:description', description);
    setMetaByProperty('og:url', url);
    setMetaByProperty('og:site_name', 'Dr. Plant');
    setMetaByProperty('og:type', route?.structuredData.includes('article') ? 'article' : 'website');
    if (socialImage) setMetaByProperty('og:image', socialImage);

    setMetaByName('twitter:card', socialImage ? 'summary_large_image' : 'summary');
    setMetaByName('twitter:title', title);
    setMetaByName('twitter:description', description);
    if (socialImage) setMetaByName('twitter:image', socialImage);

    setJsonLd(route ? buildStructuredData(route, publicSiteConfig) : []);
    trackEvent('page_view', {
      path: location.pathname,
      routeType: route ? route.kind : isAuthOrProtectedPath(location.pathname) ? 'protected' : 'app',
      siteMode: publicSiteConfig.mode,
      indexable: isIndexable,
    });
  }, [location.pathname]);

  return null;
}
