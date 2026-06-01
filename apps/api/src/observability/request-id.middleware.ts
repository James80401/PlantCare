import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'x-request-id';

/** Augment Express's Request with the correlation id we attach per request. */
declare module 'express-serve-static-core' {
  interface Request {
    requestId?: string;
  }
}

/**
 * Plain Express middleware (applied via app.use) that gives every request a stable
 * correlation id, surfaced on `req.requestId` and echoed in the response header so a
 * client error and a server log line can be matched up.
 *
 * An inbound x-request-id is honoured when it looks sane (<=128 chars), so a reverse
 * proxy or front-end can propagate a trace id; otherwise we generate a UUID. Untrusted
 * values are length-capped to avoid log-injection via an oversized header.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const inbound = req.headers[REQUEST_ID_HEADER];
  const candidate = Array.isArray(inbound) ? inbound[0] : inbound;
  const requestId =
    typeof candidate === 'string' && candidate.length > 0 && candidate.length <= 128
      ? candidate
      : randomUUID();

  req.requestId = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);
  next();
}
