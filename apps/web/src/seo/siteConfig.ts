export type PublicSiteMode = 'private' | 'teaser' | 'launch';

export interface PublicSiteConfig {
  mode: PublicSiteMode;
  canonicalBaseUrl: string;
  marketingIndexable: boolean;
  marketingPreviewEnabled: boolean;
  isDev: boolean;
}

type EnvLike = Record<string, string | boolean | undefined>;

export const DEFAULT_CANONICAL_BASE_URL = 'https://drplant.app';

export function normalizeSiteMode(value: unknown): PublicSiteMode {
  return value === 'teaser' || value === 'launch' ? value : 'private';
}

export function normalizeCanonicalBaseUrl(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return DEFAULT_CANONICAL_BASE_URL;
  return value.trim().replace(/\/+$/, '');
}

function readBoolean(value: unknown, fallback: boolean) {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return fallback;
  if (/^(1|true|yes)$/i.test(value.trim())) return true;
  if (/^(0|false|no)$/i.test(value.trim())) return false;
  return fallback;
}

export function readPublicSiteConfig(env: EnvLike = {}): PublicSiteConfig {
  const mode = normalizeSiteMode(env.VITE_PUBLIC_SITE_MODE);
  return {
    mode,
    canonicalBaseUrl: normalizeCanonicalBaseUrl(env.VITE_CANONICAL_BASE_URL),
    marketingIndexable: readBoolean(env.VITE_MARKETING_INDEXABLE, mode === 'launch'),
    marketingPreviewEnabled: readBoolean(env.VITE_ENABLE_MARKETING_PREVIEW, false),
    isDev: readBoolean(env.DEV, false),
  };
}

const viteEnv = (import.meta as unknown as { env?: EnvLike }).env ?? {};

export const publicSiteConfig = readPublicSiteConfig(viteEnv);

export function shouldRenderMarketingRoutes(config: PublicSiteConfig = publicSiteConfig) {
  return config.mode !== 'private' || config.marketingPreviewEnabled || config.isDev;
}

export function isStrictPrivateMode(config: PublicSiteConfig = publicSiteConfig) {
  return config.mode === 'private' && !shouldRenderMarketingRoutes(config);
}

export function canonicalUrl(path: string, config: PublicSiteConfig = publicSiteConfig) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${config.canonicalBaseUrl}${normalizedPath}`;
}
