import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

const logger = new Logger('HttpRequest');

/**
 * Structured access log, one JSON line per request, emitted on response 'finish' so the
 * status code and duration are the real final values (including those set by the
 * exception filter). Done as plain Express middleware rather than a Nest interceptor to
 * avoid the rxjs pipeline and to capture every response uniformly.
 *
 * Successful requests log at `log`; 5xx at `error` (the exception filter additionally
 * logs error detail + reports to Sentry). Health-probe noise is suppressed.
 */
export function accessLogMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const path = req.originalUrl ?? req.url;

  if (path.startsWith('/api/v1/health')) {
    next();
    return;
  }

  res.on('finish', () => {
    const userId = (req as Request & { user?: { sub?: string } }).user?.sub;
    const line = JSON.stringify({
      event: 'http_request',
      requestId: req.requestId,
      method: req.method,
      path,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
      responseBytes: parseContentLength(res.getHeader('content-length')),
      userId,
    });
    if (res.statusCode >= 500) logger.error(line);
    else logger.log(line);
  });

  next();
}

function parseContentLength(value: number | string | string[] | undefined) {
  const parsed = Number.parseInt(Array.isArray(value) ? value[0] : String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
