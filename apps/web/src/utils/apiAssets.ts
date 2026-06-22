const apiBaseURL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || '/api/v1';

export function resolveApiAssetUrl(
  url?: string | null,
  baseURL = apiBaseURL,
): string | null {
  if (!url) return null;
  if (/^(data:|blob:|\/\/)/i.test(url)) return url;

  const apiOrigin = /^https?:\/\//i.test(baseURL) ? new URL(baseURL).origin : null;
  if (/^https?:\/\//i.test(url)) {
    if (!apiOrigin) return url;
    const parsed = new URL(url);
    const isLegacyLocalUpload =
      ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname) &&
      parsed.pathname.startsWith('/uploads/');
    return isLegacyLocalUpload
      ? `${apiOrigin}${parsed.pathname}${parsed.search}${parsed.hash}`
      : url;
  }

  if (!url.startsWith('/')) return url;
  return apiOrigin ? `${apiOrigin}${url}` : url;
}
