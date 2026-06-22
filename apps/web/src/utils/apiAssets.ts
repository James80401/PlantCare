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

export function resolveApiThumbnailUrl(
  url?: string | null,
  size: 96 | 160 | 320 | 640 = 160,
  baseURL = apiBaseURL,
): string | null {
  const resolved = resolveApiAssetUrl(url, baseURL);
  if (!resolved || /^(data:|blob:|\/\/)/i.test(resolved)) return resolved;

  const apiOrigin = /^https?:\/\//i.test(baseURL) ? new URL(baseURL).origin : null;
  let sourcePath = resolved;
  if (/^https?:\/\//i.test(resolved)) {
    const parsed = new URL(resolved);
    if (!apiOrigin || parsed.origin !== apiOrigin) return resolved;
    sourcePath = parsed.pathname;
  }

  if (!sourcePath.startsWith('/uploads/') && !sourcePath.startsWith('/care-guides/photos/')) {
    return resolved;
  }
  return `${baseURL}/media/thumbnail?src=${encodeURIComponent(sourcePath)}&size=${size}`;
}
