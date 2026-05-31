import { BadRequestException, NotFoundException } from '@nestjs/common';
import { JournalService } from './journal.service';

describe('JournalService', () => {
  function createService(entry: { id: string } | null = { id: 'entry-1' }) {
    const prisma = {
      plant: {
        findFirst: jest.fn().mockResolvedValue({ id: 'plant-1' }),
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
});
