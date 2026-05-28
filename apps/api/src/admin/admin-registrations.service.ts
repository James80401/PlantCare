import { Injectable, NotFoundException } from '@nestjs/common';
import { AccountApprovalStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class AdminRegistrationsService {
  constructor(
    private prisma: PrismaService,
    private email: EmailService,
  ) {}

  async listPending() {
    return this.prisma.user.findMany({
      where: { accountApprovalStatus: AccountApprovalStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        createdAt: true,
      },
    });
  }

  async approve(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.accountApprovalStatus !== AccountApprovalStatus.PENDING) {
      return { message: 'User is not pending approval', userId };
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { accountApprovalStatus: AccountApprovalStatus.APPROVED },
    });

    if (this.email.isConfigured()) {
      await this.email.sendAccountApprovedEmail(user.email, user.name);
    }

    return { message: 'Account approved', userId, email: user.email };
  }

  async reject(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id: userId },
      data: { accountApprovalStatus: AccountApprovalStatus.REJECTED },
    });

    return { message: 'Account rejected', userId, email: user.email };
  }
}
