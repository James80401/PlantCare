import { PotSize } from '@prisma/client';
import { SchedulerService } from './scheduler.service';

describe('SchedulerService', () => {
  let service: SchedulerService;

  beforeEach(() => {
    service = new SchedulerService({} as never);
  });

  it('calculates water interval with pot multiplier', () => {
    expect(service.getWaterIntervalDays(7, PotSize.SMALL)).toBe(6);
    expect(service.getWaterIntervalDays(7, PotSize.LARGE)).toBe(8);
  });

  it('generates correct number of dates', () => {
    const start = new Date('2025-01-01');
    const dates = service.generateDates(start, 7, 3);
    expect(dates).toHaveLength(3);
    expect(dates[1].getTime() - dates[0].getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('detects growing season', () => {
    expect(service.isGrowingSeason(new Date('2025-06-15'))).toBe(true);
    expect(service.isGrowingSeason(new Date('2025-12-15'))).toBe(false);
  });
});
