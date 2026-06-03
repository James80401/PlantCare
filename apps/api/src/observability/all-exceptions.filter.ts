import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { captureException } from './sentry';

/**
 * Global exception filter. Adds observability without changing API response shapes:
 *
 *  - HttpException → status + body are passed through VERBATIM, so custom error
 *    payloads the frontend depends on (DR_PLANT_SCOPE_REQUIRED, AI_USAGE_PAUSED,
 *    PLANT_LIMIT_REACHED, IDENTIFY_LIMIT_REACHED, validation errors, …) are preserved.
 *  - Anything else → a generic 500 that never leaks internals, plus a correlation id.
 *
 * Every error is logged as a single structured line (greppable, correlated by
 * requestId). 5xx and unknown errors are reported to Sentry when it is enabled.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpException');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();
    const requestId = req.requestId;

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    // Build the response body.
    let body: unknown;
    if (isHttp) {
      const raw = exception.getResponse();
      // Nest convention: string responses are wrapped, object responses pass through.
      body = typeof raw === 'string' ? { statusCode: status, message: raw } : raw;
    } else {
      body = {
        statusCode: status,
        message: 'Internal server error',
        requestId,
      };
    }

    const userId =
      (req as Request & { user?: { sub?: string } }).user?.sub ?? undefined;
    const message = exception instanceof Error ? exception.message : String(exception);

    const logFields = {
      event: 'request_error',
      requestId,
      method: req.method,
      path: req.originalUrl ?? req.url,
      statusCode: status,
      userId,
      message,
    };

    if (status >= 500) {
      // Server faults: log with stack + report to Sentry.
      this.logger.error(
        JSON.stringify(logFields),
        exception instanceof Error ? exception.stack : undefined,
      );
      captureException(exception, {
        requestId,
        userId,
        method: req.method,
        path: logFields.path,
      });
    } else {
      // Client errors (4xx): expected; log at warn without a stack.
      this.logger.warn(JSON.stringify(logFields));
    }

    res.status(status).json(body);
  }
}
