import { Injectable, Logger } from '@nestjs/common';
import { subDays } from 'date-fns';
import { PrismaService } from '../prisma/prisma.service';

export const ADMIN_AUDIT_RETENTION_DAYS = 30;

export type AdminAuditOutcome = 'SUCCESS' | 'ERROR';

export interface AdminAuditRecordInput {
  actorUserId?: string;
  actorEmail?: string;
  action: string;
  method: string;
  path: string;
  targetUserId?: string;
  requestId?: string;
  statusCode: number;
  outcome: AdminAuditOutcome;
  durationMs: number;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AdminAuditService {
  private readonly logger = new Logger(AdminAuditService.name);

  constructor(private prisma: PrismaService) {}

  async record(input: AdminAuditRecordInput) {
    const cutoff = this.retentionCutoff();
    try {
      const [entry] = await this.prisma.$transaction([
        this.prisma.adminAuditLog.create({
          data: {
            actorUserId: input.actorUserId,
            actorEmail: input.actorEmail,
            action: input.action,
            method: input.method,
            path: input.path,
            targetUserId: input.targetUserId,
            requestId: input.requestId,
            statusCode: input.statusCode,
            outcome: input.outcome,
            durationMs: input.durationMs,
            ip: input.ip,
            userAgent: input.userAgent,
            metadataJson:
              input.metadata == null ? undefined : JSON.stringify(input.metadata),
          },
        }),
        this.prisma.adminAuditLog.deleteMany({
          where: { createdAt: { lt: cutoff } },
        }),
      ]);
      return entry;
    } catch (err) {
      this.logger.error(`Admin audit log write failed: ${err}`);
      return null;
    }
  }

  async listRecent(limit = 100) {
    await this.pruneExpired();
    const take = Math.min(Math.max(limit, 1), 250);
    const since = this.retentionCutoff();
    const rows = await this.prisma.adminAuditLog.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take,
    });
    return rows.map((row) => ({
      ...row,
      metadata: parseMetadata(row.metadataJson),
      metadataJson: undefined,
    }));
  }

  async summary() {
    await this.pruneExpired();
    const since = this.retentionCutoff();
    const [total, failures, latest, byAction] = await Promise.all([
      this.prisma.adminAuditLog.count({ where: { createdAt: { gte: since } } }),
      this.prisma.adminAuditLog.count({
        where: { createdAt: { gte: since }, outcome: 'ERROR' },
      }),
      this.prisma.adminAuditLog.findFirst({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.adminAuditLog.groupBy({
        by: ['action'],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
        orderBy: { _count: { action: 'desc' } },
        take: 12,
      }),
    ]);

    return {
      retentionDays: ADMIN_AUDIT_RETENTION_DAYS,
      total,
      failures,
      latest,
      byAction: byAction.map((row) => ({
        action: row.action,
        count: row._count._all,
      })),
    };
  }

  async pruneExpired() {
    return this.prisma.adminAuditLog.deleteMany({
      where: { createdAt: { lt: this.retentionCutoff() } },
    });
  }

  private retentionCutoff() {
    return subDays(new Date(), ADMIN_AUDIT_RETENTION_DAYS);
  }
}

function parseMetadata(value: string | null): Record<string, unknown> | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed
      : null;
  } catch {
    return null;
  }
}
