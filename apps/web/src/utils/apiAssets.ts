const apiBaseURL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || '/api/v1';

export function resolveApiAssetUrl(url?: string | null): string | null {
  if (!url) return null;
  if (/^(https?:|data:|blob:|\/\/)/i.test(url)) return url;
  if (!url.startsWith('/')) return url;
  if (!/^https?:\/\//i.test(apiBaseURL)) return url;
  return `${new URL(apiBaseURL).origin}${url}`;
}
