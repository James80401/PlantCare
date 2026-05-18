import { NotFoundException } from '@nestjs/common';
import { DiagnosisService } from './diagnosis.service';

describe('DiagnosisService', () => {
  function createService(diagnosis: unknown = { id: 'diagnosis-1' }) {
    const prisma = {
      diagnosis: {
        findFirst: jest.fn().mockResolvedValue(diagnosis),
        update: jest.fn().mockResolvedValue({ id: 'diagnosis-1', resolved: true }),
      },
      task: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 'task-1',
          taskType: 'HEALTH_CHECK',
          plantId: 'plant-1',
          sourceDiagnosisId: 'diagnosis-1',
        }),
      },
    };

    const service = new DiagnosisService(
      prisma as never,
      {} as never,
      { get: jest.fn() } as never,
      { isAvailable: jest.fn().mockReturnValue(false) } as never,
    );

    return { service, prisma };
  }

  it('updates diagnosis resolved status for the owning user', async () => {
    const { service, prisma } = createService();

    const result = await service.updateStatus('user-1', 'plant-1', 'diagnosis-1', {
      resolved: true,
    });

    expect(result.resolved).toBe(true);
    expect(prisma.diagnosis.findFirst).toHaveBeenCalledWith({
      where: { id: 'diagnosis-1', plantId: 'plant-1', plant: { userId: 'user-1' } },
    });
    expect(prisma.diagnosis.update).toHaveBeenCalledWith({
      where: { id: 'diagnosis-1' },
      data: { resolved: true },
    });
  });

  it('rejects status updates for diagnoses outside the user plant', async () => {
    const { service } = createService(null);

    await expect(
      service.updateStatus('user-1', 'plant-1', 'diagnosis-1', { resolved: true }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates a health check follow-up task linked to the diagnosis', async () => {
    const { service, prisma } = createService();

    const result = await service.createFollowUpTask(
      'user-1',
      'plant-1',
      'diagnosis-1',
      { dueInDays: 5 },
    );

    expect(result.taskType).toBe('HEALTH_CHECK');
    expect(prisma.task.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          plantId: 'plant-1',
          taskType: 'HEALTH_CHECK',
          sourceDiagnosisId: 'diagnosis-1',
        }),
      }),
    );
  });
});
