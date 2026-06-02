import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AdminAuditService } from './admin-audit.service';

type AdminRequest = Request & {
  requestId?: string;
  user?: { sub?: string; email?: string };
  params?: { userId?: string };
};

@Injectable()
export class AdminAuditInterceptor implements NestInterceptor {
  constructor(private audit: AdminAuditService) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const http = context.switchToHttp();
    const req = http.getRequest<AdminRequest>();
    const res = http.getResponse<Response>();
    const start = Date.now();

    res.once('finish', () => {
      void this.record(req, res, start);
    });

    return next.handle();
  }

  private async record(
    req: AdminRequest,
    res: Response,
    start: number,
  ) {
    const statusCode = res.statusCode;
    await this.audit.record({
      actorUserId: req.user?.sub,
      actorEmail: req.user?.email,
      action: adminActionName(req),
      method: req.method,
      path: req.originalUrl ?? req.url,
      targetUserId: req.params?.userId,
      requestId: req.requestId,
      statusCode,
      outcome: statusCode >= 400 ? 'ERROR' : 'SUCCESS',
      durationMs: Date.now() - start,
      ip: clientIp(req),
      userAgent: req.get('user-agent'),
      metadata: {
        route: req.route?.path,
        controller: contextName(req),
      },
    });
  }
}

function adminActionName(req: AdminRequest) {
  const method = req.method.toUpperCase();
  const path = req.originalUrl ?? req.url;
  if (method === 'POST' && path.includes('/approve')) return 'account.approve';
  if (method === 'POST' && path.includes('/reject')) return 'account.reject';
  if (method === 'POST' && path.includes('/disable')) return 'account.disable';
  if (method === 'POST' && path.includes('/ai/unpause')) return 'ai.unpause';
  if (method === 'GET' && path.includes('/admin/registrations/users')) return 'account.list';
  if (method === 'GET' && path.includes('/admin/registrations/pending')) return 'registration.pending.list';
  if (method === 'GET' && path.includes('/admin/audit/summary')) return 'audit.summary';
  if (method === 'GET' && path.includes('/admin/audit')) return 'audit.list';
  if (method === 'GET' && path.includes('/admin/observability')) return 'observability.overview';
  return `${method.toLowerCase()}.${path.replace(/^\/api\/v1\/admin\/?/, '').replace(/[/?#].*$/, '') || 'admin'}`;
}

function clientIp(req: AdminRequest) {
  const forwarded = req.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim();
  return req.ip;
}

function contextName(req: AdminRequest) {
  const stack = req.route?.stack as { name?: string }[] | undefined;
  return stack?.map((item) => item.name).filter(Boolean).join(',') || undefined;
}
