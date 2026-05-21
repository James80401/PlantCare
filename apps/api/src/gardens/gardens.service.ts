import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { addDays } from 'date-fns';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  canManageGarden,
  canViewGarden,
  parseGardenRole,
  type GardenRole,
} from './garden-authz';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { CreateGardenDto } from './dto/create-garden.dto';
import { CreateInviteDto } from './dto/create-invite.dto';
import { SharePlantDto } from './dto/share-plant.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class GardensService {
  constructor(
    private prisma: PrismaService,
    private email: EmailService,
  ) {}

  async create(userId: string, dto: CreateGardenDto) {
    return this.prisma.$transaction(async (tx) => {
      const garden = await tx.garden.create({
        data: {
          name: dto.name.trim(),
          ownerId: userId,
          members: {
            create: { userId, role: 'OWNER' },
          },
        },
        include: {
          members: { include: { user: { select: { id: true, name: true, email: true } } } },
          plants: { include: { plant: { include: { species: true } } } },
        },
      });
      await this.logActivity(tx, {
        gardenId: garden.id,
        actorId: userId,
        type: 'GARDEN_CREATED',
        payload: { name: garden.name },
      });
      return garden;
    });
  }

  findMine(userId: string) {
    return this.prisma.garden.findMany({
      where: {
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        plants: { include: { plant: { include: { species: true } } } },
        _count: { select: { invites: true, activity: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createInvite(userId: string, gardenId: string, dto: CreateInviteDto) {
    const role = parseGardenRole(dto.role);
    if (!role || role === 'OWNER') {
      throw new BadRequestException('Invalid invite role');
    }
    await this.requireRole(userId, gardenId, canManageGarden);

    const garden = await this.prisma.garden.findUnique({
      where: { id: gardenId },
      select: { name: true },
    });
    if (!garden) throw new NotFoundException('Garden not found');

    const inviter = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    const token = randomBytes(24).toString('hex');
    const email = dto.email?.trim().toLowerCase() || null;
    const invite = await this.prisma.careInvite.create({
      data: {
        gardenId,
        email,
        token,
        role,
        expiresAt: addDays(new Date(), 7),
      },
    });

    await this.logActivity(this.prisma, {
      gardenId,
      actorId: userId,
      type: 'INVITE_CREATED',
      payload: { role, email: invite.email },
    });

    let emailSent = false;
    if (email) {
      const sent = await this.email.sendHouseholdInviteEmail(
        email,
        inviter?.name ?? null,
        garden.name,
        role,
        token,
      );
      emailSent = sent.success;
    }

    return { ...invite, emailSent };
  }

  async acceptInvite(userId: string, dto: AcceptInviteDto) {
    const invite = await this.prisma.careInvite.findUnique({
      where: { token: dto.token },
      include: { garden: true },
    });
    if (!invite || invite.acceptedAt) {
      throw new NotFoundException('Invite not found');
    }
    if (invite.expiresAt < new Date()) {
      throw new BadRequestException('Invite has expired');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (invite.email && user?.email.toLowerCase() !== invite.email.toLowerCase()) {
      throw new ForbiddenException('This invite was sent to a different email');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.gardenMember.upsert({
        where: { gardenId_userId: { gardenId: invite.gardenId, userId } },
        create: { gardenId: invite.gardenId, userId, role: invite.role },
        update: { role: invite.role },
      });
      await tx.careInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });
      await this.logActivity(tx, {
        gardenId: invite.gardenId,
        actorId: userId,
        type: 'INVITE_ACCEPTED',
        payload: { role: invite.role },
      });
      return tx.garden.findUnique({
        where: { id: invite.gardenId },
        include: {
          members: { include: { user: { select: { id: true, name: true, email: true } } } },
          plants: { include: { plant: { include: { species: true } } } },
        },
      });
    });
  }

  async sharePlant(userId: string, gardenId: string, dto: SharePlantDto) {
    await this.requireRole(userId, gardenId, canManageGarden);

    const plant = await this.prisma.plant.findFirst({
      where: { id: dto.plantId, userId },
    });
    if (!plant) throw new NotFoundException('Plant not found or not owned by you');

    const share = await this.prisma.plantShare.upsert({
      where: { gardenId_plantId: { gardenId, plantId: dto.plantId } },
      create: {
        gardenId,
        plantId: dto.plantId,
        canComplete: dto.canComplete ?? true,
        canJournal: dto.canJournal ?? false,
      },
      update: {
        canComplete: dto.canComplete ?? true,
        canJournal: dto.canJournal ?? false,
      },
      include: { plant: { include: { species: true } } },
    });

    await this.logActivity(this.prisma, {
      gardenId,
      actorId: userId,
      type: 'PLANT_SHARED',
      payload: { plantId: dto.plantId, canComplete: share.canComplete },
    });

    return share;
  }

  async getActivity(userId: string, gardenId: string) {
    await this.requireRole(userId, gardenId, canViewGarden);
    return this.prisma.activityEvent.findMany({
      where: { gardenId },
      include: { actor: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getMemberRole(userId: string, gardenId: string): Promise<GardenRole | null> {
    const member = await this.prisma.gardenMember.findUnique({
      where: { gardenId_userId: { gardenId, userId } },
    });
    if (!member) return null;
    return parseGardenRole(member.role);
  }

  private async requireRole(
    userId: string,
    gardenId: string,
    predicate: (role: GardenRole) => boolean,
  ) {
    const role = await this.getMemberRole(userId, gardenId);
    if (!role || !predicate(role)) {
      throw new ForbiddenException('Not allowed for this garden');
    }
    return role;
  }

  private async logActivity(
    client: PrismaService | Prisma.TransactionClient,
    data: { gardenId: string; actorId: string; type: string; payload: Record<string, unknown> },
  ) {
    await client.activityEvent.create({
      data: {
        gardenId: data.gardenId,
        actorId: data.actorId,
        type: data.type,
        payload: JSON.stringify(data.payload),
      },
    });
  }
}
