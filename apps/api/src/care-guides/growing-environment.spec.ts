import {
  classifySpeciesForCare,
  inferGrowingEnvironment,
  shouldScheduleMist,
} from './growing-environment';

describe('growing-environment', () => {
  it('detects outdoor locations', () => {
    expect(inferGrowingEnvironment('Garden')).toBe('outdoor');
    expect(inferGrowingEnvironment('Backyard bed')).toBe('outdoor');
  });

  it('detects semi-outdoor locations', () => {
    expect(inferGrowingEnvironment('Balcony')).toBe('semi_outdoor');
    expect(inferGrowingEnvironment('Patio')).toBe('semi_outdoor');
  });

  it('skips mist for outdoor and succulents', () => {
    const agave = classifySpeciesForCare({
      commonName: 'Agave',
      wateringFreqDays: 14,
    });
    expect(shouldScheduleMist('outdoor', agave)).toBe(false);
    expect(shouldScheduleMist('indoor', agave)).toBe(false);
  });

  it('schedules mist for indoor ferns', () => {
    const fern = classifySpeciesForCare({
      commonName: 'Boston Fern',
      wateringFreqDays: 3,
    });
    expect(shouldScheduleMist('indoor', fern)).toBe(true);
    expect(shouldScheduleMist('outdoor', fern)).toBe(false);
  });
});
