import { NotFoundException } from '@nestjs/common';
import { PotSize } from '@prisma/client';
import { PlantsService } from './plants.service';

describe('PlantsService', () => {
  const plant = {
    id: 'plant-1',
    userId: 'user-1',
    speciesId: 'species-1',
    nickname: 'Kitchen fern',
    location: 'Indoor — medium light',
    potSize: PotSize.MEDIUM,
    imageUrl: 'https://example.com/old.jpg',
    notes: 'Old notes',
  };

  function createService() {
    const prisma = {
      plant: {
        findFirst: jest.fn().mockResolvedValue(plant),
        update: jest.fn().mockResolvedValue({ ...plant, nickname: 'Updated' }),
      },
    };
    const scheduler = {
      generateTasksForPlant: jest.fn().mockResolvedValue(undefined),
    };
    const upload = {
      deleteByUrl: jest.fn().mockResolvedValue(undefined),
      saveFile: jest.fn(),
    };

    const service = new PlantsService(
      prisma as never,
      {} as never,
      scheduler as never,
      upload as never,
      {} as never,
      {} as never,
      {} as never,
    );

    return { service, prisma, scheduler, upload };
  }

  it('updates nickname, pot size, notes, and image for the owner', async () => {
    const { service, prisma, scheduler } = createService();
    const findOne = jest.spyOn(service, 'findOne').mockResolvedValue({
      ...plant,
      species: {},
      tasks: [],
      journalEntries: [],
      diagnoses: [],
      careOverview: {},
    } as never);

    const result = await service.update('user-1', 'plant-1', 'PREMIUM' as never, {
      nickname: '  Patio fern  ',
      potSize: PotSize.LARGE,
      notes: 'Moved to brighter corner',
      imageUrl: 'https://example.com/new.jpg',
    });

    expect(prisma.plant.update).toHaveBeenCalledWith({
      where: { id: 'plant-1' },
      data: {
        nickname: 'Patio fern',
        potSize: PotSize.LARGE,
        notes: 'Moved to brighter corner',
        imageUrl: 'https://example.com/new.jpg',
      },
    });
    expect(scheduler.generateTasksForPlant).toHaveBeenCalledWith('plant-1', 'PREMIUM');
    expect(result.tasksRescheduled).toBe(true);
    findOne.mockRestore();
  });

  it('rejects updates for plants outside the user', async () => {
    const { service, prisma } = createService();
    prisma.plant.findFirst.mockResolvedValue(null);

    await expect(
      service.update('user-1', 'missing', 'FREE' as never, { notes: 'nope' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
