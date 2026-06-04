import { DiagnosisController } from './diagnosis.controller';

describe('DiagnosisController', () => {
  it('passes diagnosis status updates to the service', () => {
    const diagnosisService = {
      updateStatus: jest.fn(),
    };
    const chat = { getContextSummary: jest.fn() };
    const controller = new DiagnosisController(diagnosisService as never, chat as never);
    const dto = { resolved: true };

    controller.updateStatus(
      { sub: 'user-1', email: 'test@example.com', planTier: 'PREMIUM' },
      'plant-1',
      'diagnosis-1',
      dto,
    );

    expect(diagnosisService.updateStatus).toHaveBeenCalledWith(
      'user-1',
      'plant-1',
      'diagnosis-1',
      dto,
    );
  });

  it('delegates the context summary to the chat service', () => {
    const chat = { getContextSummary: jest.fn() };
    const controller = new DiagnosisController({} as never, chat as never);

    controller.getContextSummary(
      { sub: 'user-1', email: 'test@example.com', planTier: 'PREMIUM' },
      'plant-1',
    );

    expect(chat.getContextSummary).toHaveBeenCalledWith('user-1', 'plant-1');
  });
});
