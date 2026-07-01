import { BadRequestException, NotFoundException } from '@nestjs/common';
import { JournalService } from './journal.service';

describe('JournalService', () => {
  function createService(
    entry: { id: string; notes?: string; photoUrl?: string | null } | null = { id: 'entry-1' },
    plant: Record<string, unknown> | null = { id: 'plant-1', userId: 'user-1', shares: [] },
  ) {
    const prisma = {
      plant: {
        findFirst: jest.fn().mockResolvedValue(plant),
      },
      journalEntry: {
        findMany: jest.fn().mockResolvedValue([entry]),
        findFirst: jest.fn().mockResolvedValue(entry),
        create: jest.fn().mockResolvedValue({ id: 'entry-1', notes: 'hello' }),
        update: jest.fn().mockResolvedValue({ id: 'entry-1', notes: 'updated' }),
        delete: jest.fn().mockResolvedValue({ id: 'entry-1' }),
      },
    };

    const service = new JournalService(
      prisma as never,
      {} as never,
      { assertImageAllowed: jest.fn().mockResolvedValue(null) } as never,
    );
    return { service, prisma };
  }

  it('requires a note or photo when creating', async () => {
    const { service } = createService();

    await expect(service.create('user-1', 'plant-1', {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('updates a journal entry for the owning user', async () => {
    const { service, prisma } = createService();

    const result = await service.update('user-1', 'plant-1', 'entry-1', {
      notes: 'updated',
      heightCm: 12,
    });

    expect(result.notes).toBe('updated');
    expect(prisma.journalEntry.update).toHaveBeenCalled();
  });

  it('deletes a journal entry', async () => {
    const { service, prisma } = createService();

    const result = await service.remove('user-1', 'plant-1', 'entry-1');

    expect(result.deleted).toBe(true);
    expect(prisma.journalEntry.delete).toHaveBeenCalledWith({ where: { id: 'entry-1' } });
  });

  it('rejects updates for missing entries', async () => {
    const { service } = createService(null);

    await expect(
      service.update('user-1', 'plant-1', 'entry-1', { notes: 'nope' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects operations on a plant the user cannot see at all', async () => {
    const { service } = createService({ id: 'entry-1' }, null);

    await expect(service.findAll('stranger', 'plant-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(
      service.create('stranger', 'plant-1', { notes: 'hi' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lets a garden viewer read journal entries for a shared plant', async () => {
    const sharedPlant = {
      id: 'plant-1',
      userId: 'owner',
      garden: null,
      shares: [
        {
          canComplete: true,
          canJournal: false,
          garden: { members: [{ userId: 'viewer-1', role: 'VIEWER' }] },
        },
      ],
    };
    const { service } = createService({ id: 'entry-1' }, sharedPlant);

    await expect(service.findAll('viewer-1', 'plant-1')).resolves.toEqual([
      { id: 'entry-1' },
    ]);
  });

  it('blocks a garden viewer from writing journal entries for a shared plant', async () => {
    const sharedPlant = {
      id: 'plant-1',
      userId: 'owner',
      garden: null,
      shares: [
        {
          canComplete: true,
          canJournal: true,
          garden: { members: [{ userId: 'viewer-1', role: 'VIEWER' }] },
        },
      ],
    };
    const { service } = createService({ id: 'entry-1' }, sharedPlant);

    await expect(
      service.create('viewer-1', 'plant-1', { notes: 'sneaky edit' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.remove('viewer-1', 'plant-1', 'entry-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('blocks a caregiver without the canJournal grant from writing entries', async () => {
    const sharedPlant = {
      id: 'plant-1',
      userId: 'owner',
      garden: null,
      shares: [
        {
          canComplete: true,
          canJournal: false,
          garden: { members: [{ userId: 'caregiver-1', role: 'CAREGIVER' }] },
        },
      ],
    };
    const { service } = createService({ id: 'entry-1' }, sharedPlant);

    await expect(
      service.create('caregiver-1', 'plant-1', { notes: 'nope' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lets a caregiver with the canJournal grant write entries', async () => {
    const sharedPlant = {
      id: 'plant-1',
      userId: 'owner',
      garden: null,
      shares: [
        {
          canComplete: true,
          canJournal: true,
          garden: { members: [{ userId: 'caregiver-1', role: 'CAREGIVER' }] },
        },
      ],
    };
    const { service, prisma } = createService({ id: 'entry-1' }, sharedPlant);

    await service.create('caregiver-1', 'plant-1', { notes: 'growth update' });
    expect(prisma.journalEntry.create).toHaveBeenCalled();
  });
});
