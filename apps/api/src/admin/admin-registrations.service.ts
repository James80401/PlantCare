import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccountApprovalStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { isAdminEmail } from '../config/registration-policy';

@Injectable()
export class AdminRegistrationsService {
  constructor(
    private prisma: PrismaService,
    private email: EmailService,
    private config: ConfigService,
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

  async listUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        accountApprovalStatus: true,
        createdAt: true,
        _count: { select: { plants: true } },
      },
    });
    return users.map((user) => ({
      ...user,
      isAdmin: isAdminEmail(this.config, user.email),
    }));
  }

  async approve(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.accountApprovalStatus === AccountApprovalStatus.APPROVED) {
      return { message: 'Account already approved', userId, email: user.email };
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
    this.assertNotAdmin(user.email);

    await this.prisma.user.update({
      where: { id: userId },
      data: { accountApprovalStatus: AccountApprovalStatus.REJECTED },
    });

    return { message: 'Account rejected', userId, email: user.email };
  }

  async disable(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    this.assertNotAdmin(user.email);

    await this.prisma.user.update({
      where: { id: userId },
      data: { accountApprovalStatus: AccountApprovalStatus.REJECTED },
    });

    return { message: 'Account disabled', userId, email: user.email };
  }

  private assertNotAdmin(email: string) {
    if (isAdminEmail(this.config, email)) {
      throw new BadRequestException('Admin accounts cannot be disabled from this portal.');
    }
  }
}
