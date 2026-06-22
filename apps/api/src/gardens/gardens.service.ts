import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { addDays, startOfDay } from 'date-fns';
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

type GardenEnvironment = 'Indoor' | 'Outdoor';

function normalizeGardenEnvironment(value?: string): GardenEnvironment {
  return value === 'Outdoor' ? 'Outdoor' : 'Indoor';
}

export interface GardenSummaryCard {
  id: string;
  name: string;
  location: string | null;
  isOwner: boolean;
  plantCount: number;
  memberCount: number;
  tasksDueToday: number;
  overdue: number;
  urgentAlerts: number;
  status: string;
}

function deriveGardenStatus(input: {
  plantCount: number;
  overdueCount: number;
  tasksDueToday: number;
  urgentAlerts: number;
}): string {
  if (input.plantCount === 0) return 'No plants yet';
  if (input.urgentAlerts > 0) return 'Needs attention';
  if (input.overdueCount > 0) return 'Care waiting';
  if (input.tasksDueToday > 0) return 'Care due today';
  return 'All caught up';
}

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
          location: normalizeGardenEnvironment(dto.location),
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

  /**
   * Summary cards for the landing page / My Gardens: per garden, the counts a user
   * needs to triage at a glance (plants, tasks due today, overdue, urgent alerts),
   * plus ownership and member count. One garden query + three grouped aggregates.
   */
  async getSummaries(userId: string): Promise<GardenSummaryCard[]> {
    const now = new Date();
    const todayStart = startOfDay(now);
    const tomorrowStart = startOfDay(addDays(now, 1));

    const gardens = await this.prisma.garden.findMany({
      where: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] },
      select: {
        id: true,
        name: true,
        location: true,
        ownerId: true,
        _count: { select: { homePlants: true, members: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const gardenIds = gardens.map((g) => g.id);
    if (gardenIds.length === 0) return [];

    const [dueToday, overdue, alerts] = await Promise.all([
      this.prisma.task.groupBy({
        by: ['gardenId', 'plantId', 'taskType'],
        where: {
          gardenId: { in: gardenIds },
          status: 'PENDING',
          dueDate: { gte: todayStart, lt: tomorrowStart },
        },
      }),
      this.prisma.task.groupBy({
        by: ['gardenId', 'plantId', 'taskType'],
        where: {
          gardenId: { in: gardenIds },
          status: 'PENDING',
          dueDate: { lt: todayStart },
        },
      }),
      this.prisma.plant.groupBy({
        by: ['gardenId'],
        where: { gardenId: { in: gardenIds }, diagnoses: { some: { resolved: false } } },
        _count: { _all: true },
      }),
    ]);

    const toCareStopMap = (rows: Array<{ gardenId: string | null }>) => {
      const m = new Map<string, number>();
      for (const r of rows) {
        if (r.gardenId) m.set(r.gardenId, (m.get(r.gardenId) ?? 0) + 1);
      }
      return m;
    };
    const dueTodayMap = toCareStopMap(dueToday);
    const overdueMap = toCareStopMap(overdue);
    const alertsMap = new Map(
      alerts.map((row) => [row.gardenId, row._count._all] as const),
    );

    return gardens.map((g) => {
      const plantCount = g._count.homePlants;
      const tasksDueToday = dueTodayMap.get(g.id) ?? 0;
      const overdueCount = overdueMap.get(g.id) ?? 0;
      const urgentAlerts = alertsMap.get(g.id) ?? 0;
      return {
        id: g.id,
        name: g.name,
        location: g.location,
        isOwner: g.ownerId === userId,
        plantCount,
        memberCount: g._count.members,
        tasksDueToday,
        overdue: overdueCount,
        urgentAlerts,
        status: deriveGardenStatus({ plantCount, overdueCount, tasksDueToday, urgentAlerts }),
      };
    });
  }

  /**
   * Garden detail for the Garden Dashboard: header + members + home plants (each with its
   * next task and an attention flag), task buckets (due today / overdue / upcoming), the
   * next watering date, a notes count, and the garden's pending tasks for the Tasks view.
   */
  async getDetail(userId: string, gardenId: string) {
    await this.requireRole(userId, gardenId, canViewGarden);

    const now = new Date();
    const todayStart = startOfDay(now);
    const tomorrowStart = startOfDay(addDays(now, 1));
    const upcomingEnd = startOfDay(addDays(now, 8)); // next 7 days after today

    const [garden, pendingTasks, notesCount] = await Promise.all([
      this.prisma.garden.findUnique({
        where: { id: gardenId },
        select: {
          id: true,
          name: true,
          location: true,
          ownerId: true,
          members: { include: { user: { select: { id: true, name: true, email: true } } } },
          homePlants: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              nickname: true,
              imageUrl: true,
              location: true,
              species: { select: { commonName: true, scientificName: true } },
              diagnoses: { where: { resolved: false }, select: { id: true } },
            },
          },
        },
      }),
      this.prisma.task.findMany({
        where: { gardenId, status: 'PENDING' },
        orderBy: { dueDate: 'asc' },
        take: 200,
        select: {
          id: true,
          taskType: true,
          dueDate: true,
          status: true,
          completedAt: true,
          plant: {
            select: {
              id: true,
              nickname: true,
              imageUrl: true,
              species: { select: { commonName: true } },
            },
          },
        },
      }),
      this.prisma.journalEntry.count({ where: { plant: { gardenId } } }),
    ]);
    if (!garden) throw new NotFoundException('Garden not found');

    // Derive task buckets, next watering, and per-plant next task from the one task fetch.
    const dueTodayStops = new Set<string>();
    const overdueStops = new Set<string>();
    const upcomingStops = new Set<string>();
    let nextWatering: Date | null = null;
    const nextTaskByPlant = new Map<string, { taskType: string; dueDate: Date }>();
    for (const t of pendingTasks) {
      const careStopKey = `${t.plant.id}:${t.taskType}`;
      if (t.dueDate < todayStart) overdueStops.add(careStopKey);
      else if (t.dueDate < tomorrowStart) dueTodayStops.add(careStopKey);
      else if (t.dueDate < upcomingEnd) upcomingStops.add(careStopKey);
      if (t.taskType === 'WATER' && (!nextWatering || t.dueDate < nextWatering)) {
        nextWatering = t.dueDate;
      }
      if (!nextTaskByPlant.has(t.plant.id)) {
        nextTaskByPlant.set(t.plant.id, { taskType: t.taskType, dueDate: t.dueDate });
      }
    }

    return {
      id: garden.id,
      name: garden.name,
      location: garden.location,
      isOwner: garden.ownerId === userId,
      members: garden.members,
      taskSummary: {
        dueToday: dueTodayStops.size,
        overdue: overdueStops.size,
        upcoming: upcomingStops.size,
      },
      nextWatering: nextWatering ? nextWatering.toISOString() : null,
      notesCount,
      plants: garden.homePlants.map((p) => ({
        id: p.id,
        nickname: p.nickname,
        imageUrl: p.imageUrl,
        location: p.location,
        species: p.species,
        needsAttention: p.diagnoses.length > 0,
        nextTask: nextTaskByPlant.get(p.id)
          ? {
              taskType: nextTaskByPlant.get(p.id)!.taskType,
              dueDate: nextTaskByPlant.get(p.id)!.dueDate.toISOString(),
            }
          : null,
      })),
      // Pending tasks (TaskItem-shaped) for the garden Tasks subsection.
      tasks: pendingTasks.map((t) => ({
        id: t.id,
        taskType: t.taskType,
        dueDate: t.dueDate.toISOString(),
        status: t.status,
        completedAt: t.completedAt ? t.completedAt.toISOString() : null,
        plant: {
          id: t.plant.id,
          nickname: t.plant.nickname,
          imageUrl: t.plant.imageUrl,
          species: t.plant.species,
        },
      })),
    };
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

  /** Pending (unaccepted, unexpired) invites for a garden — owner only. */
  async getInvites(userId: string, gardenId: string) {
    await this.requireRole(userId, gardenId, canManageGarden);
    return this.prisma.careInvite.findMany({
      where: { gardenId, acceptedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, role: true, token: true, expiresAt: true, createdAt: true },
    });
  }

  /** Remove a member from a garden — owner only; the owner cannot be removed. */
  async removeMember(userId: string, gardenId: string, memberUserId: string) {
    await this.requireRole(userId, gardenId, canManageGarden);
    const garden = await this.prisma.garden.findUnique({
      where: { id: gardenId },
      select: { ownerId: true },
    });
    if (!garden) throw new NotFoundException('Garden not found');
    if (garden.ownerId === memberUserId) {
      throw new BadRequestException('The garden owner cannot be removed.');
    }
    await this.prisma.gardenMember.deleteMany({ where: { gardenId, userId: memberUserId } });
    await this.logActivity(this.prisma, {
      gardenId,
      actorId: userId,
      type: 'MEMBER_REMOVED',
      payload: { userId: memberUserId },
    });
    return { removed: true };
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
