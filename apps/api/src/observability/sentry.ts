import { Logger } from '@nestjs/common';

/**
 * Optional Sentry error reporting. Entirely no-op unless SENTRY_DSN is set AND
 * @sentry/node is installed — consistent with the app's "optional integration"
 * pattern. This file declares no hard dependency on @sentry/node; it is loaded via a
 * non-statically-analysable dynamic import so the build stays green without it.
 *
 * To enable in production:
 *   npm i @sentry/node --workspace @plant-care/api
 *   set SENTRY_DSN=...   (and optionally SENTRY_ENVIRONMENT, SENTRY_TRACES_SAMPLE_RATE)
 */
const logger = new Logger('Sentry');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: any = null;

export async function initSentry(): Promise<void> {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return;

  try {
    // Variable module specifier keeps TypeScript from requiring the package at build
    // time; resolves at runtime only when installed.
    const moduleName = '@sentry/node';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Sentry: any = await import(moduleName);
    Sentry.init({
      dsn,
      environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0,
    });
    client = Sentry;
    logger.log('Sentry error reporting enabled');
  } catch (err) {
    logger.warn(
      `SENTRY_DSN is set but @sentry/node could not be loaded (${err instanceof Error ? err.message : err}). ` +
        'Install it with: npm i @sentry/node --workspace @plant-care/api',
    );
  }
}

export function isSentryEnabled(): boolean {
  return client != null;
}

/**
 * Report an exception with correlation context. Safe to call unconditionally; no-ops
 * when Sentry is not enabled and never throws.
 */
export function captureException(
  err: unknown,
  context: { requestId?: string; userId?: string; method?: string; path?: string } = {},
): void {
  if (!client) return;
  try {
    client.withScope((scope: { setTag: (k: string, v: string) => void; setExtra: (k: string, v: unknown) => void }) => {
      if (context.requestId) scope.setTag('requestId', context.requestId);
      if (context.userId) scope.setTag('userId', context.userId);
      if (context.method) scope.setExtra('method', context.method);
      if (context.path) scope.setExtra('path', context.path);
      client.captureException(err);
    });
  } catch {
    // Never let error reporting break the request path.
  }
}
