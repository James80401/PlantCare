import { BadRequestException } from '@nestjs/common';
import { AccountApprovalStatus } from '@prisma/client';
import { AdminRegistrationsService } from './admin-registrations.service';

describe('AdminRegistrationsService', () => {
  function createService(
    user: {
      id: string;
      email: string;
      name: string | null;
      accountApprovalStatus: AccountApprovalStatus;
      emailVerified?: boolean;
      createdAt?: Date;
      _count?: { plants: number };
    } = {
      id: 'user-1',
      email: 'user@example.com',
      name: null,
      accountApprovalStatus: AccountApprovalStatus.PENDING,
    },
  ) {
    const prisma = {
      user: {
        findMany: jest.fn().mockResolvedValue([user]),
        findUnique: jest.fn().mockResolvedValue(user),
        update: jest.fn().mockResolvedValue(user),
      },
    };
    const email = {
      isConfigured: jest.fn().mockReturnValue(false),
      sendAccountApprovedEmail: jest.fn(),
    };
    const config = {
      get: jest.fn((key: string) => (key === 'ADMIN_EMAILS' ? 'admin@example.com' : undefined)),
    };
    const service = new AdminRegistrationsService(prisma as never, email as never, config as never);
    return { service, prisma, email };
  }

  it('lists users with admin flag and plant count', async () => {
    const { service } = createService({
      id: 'admin-1',
      email: 'admin@example.com',
      name: 'Admin',
      emailVerified: true,
      accountApprovalStatus: AccountApprovalStatus.APPROVED,
      createdAt: new Date(),
      _count: { plants: 2 },
    });

    const users = await service.listUsers();

    expect(users[0].isAdmin).toBe(true);
    expect(users[0]._count?.plants).toBe(2);
  });

  it('approves rejected users to re-enable access', async () => {
    const { service, prisma } = createService({
      id: 'user-1',
      email: 'user@example.com',
      name: null,
      accountApprovalStatus: AccountApprovalStatus.REJECTED,
    });

    await service.approve('user-1');

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { accountApprovalStatus: AccountApprovalStatus.APPROVED },
    });
  });

  it('disables approved user access', async () => {
    const { service, prisma } = createService({
      id: 'user-1',
      email: 'user@example.com',
      name: null,
      accountApprovalStatus: AccountApprovalStatus.APPROVED,
    });

    await service.disable('user-1');

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { accountApprovalStatus: AccountApprovalStatus.REJECTED },
    });
  });

  it('does not disable configured admin accounts', async () => {
    const { service } = createService({
      id: 'admin-1',
      email: 'admin@example.com',
      name: 'Admin',
      accountApprovalStatus: AccountApprovalStatus.APPROVED,
    });

    await expect(service.disable('admin-1')).rejects.toBeInstanceOf(BadRequestException);
  });
});
