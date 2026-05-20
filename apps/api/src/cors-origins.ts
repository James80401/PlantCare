/** Capacitor WebView origins (Android https scheme + iOS capacitor scheme). */
const MOBILE_APP_ORIGINS = ['https://localhost', 'capacitor://localhost', 'http://localhost'];

const DEV_ORIGINS = ['http://localhost:5173', 'http://localhost:8080'];

/**
 * Comma-separated list in CORS_ORIGINS or CORS_ORIGIN, plus FRONTEND_URL.
 * Mobile app origins are always allowed so Capacitor builds work against a hosted API.
 */
export function getCorsOrigins(): string[] {
  const fromEnv = (process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const frontend = process.env.FRONTEND_URL?.trim();
  const origins = new Set<string>([...fromEnv, ...(frontend ? [frontend] : [])]);

  for (const o of MOBILE_APP_ORIGINS) {
    origins.add(o);
  }

  if (process.env.NODE_ENV !== 'production') {
    for (const o of DEV_ORIGINS) {
      origins.add(o);
    }
  }

  if (origins.size === 0) {
    return [...DEV_ORIGINS, ...MOBILE_APP_ORIGINS];
  }

  return [...origins];
}
