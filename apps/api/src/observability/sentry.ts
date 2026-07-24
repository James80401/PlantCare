import { Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';

/**
 * Optional Sentry error reporting. The integration is installed and build-verified,
 * but remains entirely disabled unless SENTRY_DSN is configured.
 *
 * To enable in production:
 *   set SENTRY_DSN=...   (and optionally SENTRY_ENVIRONMENT, SENTRY_TRACES_SAMPLE_RATE)
 */
const logger = new Logger('Sentry');

let enabled = false;

export async function initSentry(): Promise<void> {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    release: process.env.APP_COMMIT_SHA || undefined,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0,
    sendDefaultPii: false,
  });
  enabled = true;
  logger.log('Sentry error reporting enabled');
}

export function isSentryEnabled(): boolean {
  return enabled;
}

/**
 * Report an exception with correlation context. Safe to call unconditionally; no-ops
 * when Sentry is not enabled and never throws.
 */
export function captureException(
  err: unknown,
  context: { requestId?: string; userId?: string; method?: string; path?: string } = {},
): void {
  if (!enabled) return;
  try {
    Sentry.withScope((scope) => {
      if (context.requestId) scope.setTag('requestId', context.requestId);
      if (context.userId) scope.setTag('userId', context.userId);
      if (context.method) scope.setExtra('method', context.method);
      if (context.path) scope.setExtra('path', context.path);
      Sentry.captureException(err);
    });
  } catch {
    // Never let error reporting break the request path.
  }
}
