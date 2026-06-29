import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { findMarketingRoute, isAuthOrProtectedPath, isMarketingRouteIndexable } from './marketingRegistry';
import { buildPageHead } from './headTags';
import { publicSiteConfig } from './siteConfig';
import { trackEvent } from '../utils/analytics';

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
    const head = buildPageHead(route, location.pathname, publicSiteConfig);

    document.title = head.title;
    setMetaByName('description', head.description);
    setMetaByName('robots', head.robots);
    setCanonical(head.canonical);

    for (const [property, content] of Object.entries(head.og)) setMetaByProperty(property, content);
    for (const [name, content] of Object.entries(head.twitter)) setMetaByName(name, content);

    setJsonLd(head.jsonLd);
    trackEvent('page_view', {
      path: location.pathname,
      routeType: route ? route.kind : isAuthOrProtectedPath(location.pathname) ? 'protected' : 'app',
      siteMode: publicSiteConfig.mode,
      indexable: route ? isMarketingRouteIndexable(route, publicSiteConfig) : false,
    });
  }, [location.pathname]);

  return null;
}
