import { describe, expect, it } from 'vitest';
import { formatTemperature, formatTemperatureRange } from './temperature';

describe('temperature formatting', () => {
  it('formats celsius', () => {
    expect(formatTemperature(20, 'C')).toBe('20°C');
  });

  it('formats fahrenheit', () => {
    expect(formatTemperature(0, 'F')).toBe('32°F');
  });

  it('formats a range in fahrenheit', () => {
    expect(formatTemperatureRange(10, 20, 'F')).toBe('50–68°F');
  });
});
