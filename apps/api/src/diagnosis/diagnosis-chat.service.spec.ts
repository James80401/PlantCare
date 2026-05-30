import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DiagnosisChatService } from './diagnosis-chat.service';

describe('DiagnosisChatService actions', () => {
  function createService(messages: unknown[] = [{ id: 'msg-1', role: 'assistant', content: 'Check soil moisture.' }]) {
    const prisma = {
      plant: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'plant-1',
          userId: 'user-1',
          location: 'Living room',
          potSize: 'MEDIUM',
          species: { commonName: 'Snake Plant', wateringFreqDays: 14 },
        }),
      },
      diagnosisConversation: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'conv-1',
          plantId: 'plant-1',
          userId: 'user-1',
          messages,
        }),
      },
      journalEntry: {
        create: jest.fn().mockResolvedValue({ id: 'journal-1' }),
      },
      task: {
        create: jest.fn().mockResolvedValue({
          id: 'task-1',
          plantId: 'plant-1',
          taskType: 'HEALTH_CHECK',
        }),
      },
    };

    const service = new DiagnosisChatService(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
    );

    return { service, prisma };
  }

  it('saves an assistant reply to the journal', async () => {
    const { service, prisma } = createService();

    await service.saveAssistantReplyToJournal('user-1', 'plant-1', 'conv-1', {
      messageId: 'msg-1',
    });

    expect(prisma.diagnosisConversation.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'conv-1', plantId: 'plant-1', userId: 'user-1' },
      }),
    );
    expect(prisma.journalEntry.create).toHaveBeenCalledWith({
      data: {
        plantId: 'plant-1',
        notes: 'Dr. Plant note:\n\nCheck soil moisture.',
      },
    });
  });

  it('schedules a health check and logs the chat context', async () => {
    const { service, prisma } = createService();

    const result = await service.scheduleHealthCheckFromChat('user-1', 'plant-1', 'conv-1', {
      messageId: 'msg-1',
      dueInDays: 5,
    });

    expect(result.taskType).toBe('HEALTH_CHECK');
    expect(prisma.task.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          plantId: 'plant-1',
          taskType: 'HEALTH_CHECK',
        }),
      }),
    );
    expect(prisma.journalEntry.create).toHaveBeenCalledWith({
      data: {
        plantId: 'plant-1',
        notes: 'Dr. Plant health check scheduled in 5 days:\n\nCheck soil moisture.',
      },
    });
  });

  it('rejects actions outside the user conversation', async () => {
    const { service, prisma } = createService();
    prisma.diagnosisConversation.findFirst.mockResolvedValue(null);

    await expect(
      service.saveAssistantReplyToJournal('user-1', 'plant-1', 'missing', {}),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('requires an assistant reply or explicit note', async () => {
    const { service } = createService([{ id: 'msg-1', role: 'user', content: 'Hello' }]);

    await expect(
      service.saveAssistantReplyToJournal('user-1', 'plant-1', 'conv-1', {
        messageId: 'msg-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
