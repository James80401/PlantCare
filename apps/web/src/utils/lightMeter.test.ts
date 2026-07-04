import { describe, expect, it } from 'vitest';
import { averageBrightnessFromImageData, levelForBrightness } from './lightMeter';

describe('levelForBrightness', () => {
  it('classifies dim readings as low', () => {
    expect(levelForBrightness(0)).toBe('low');
    expect(levelForBrightness(69)).toBe('low');
  });

  it('classifies mid-range readings as medium', () => {
    expect(levelForBrightness(70)).toBe('medium');
    expect(levelForBrightness(159)).toBe('medium');
  });

  it('classifies bright readings as high', () => {
    expect(levelForBrightness(160)).toBe('high');
    expect(levelForBrightness(255)).toBe('high');
  });
});

describe('averageBrightnessFromImageData', () => {
  it('returns 0 for a fully black image', () => {
    const data = new Uint8ClampedArray([0, 0, 0, 255, 0, 0, 0, 255]);
    expect(averageBrightnessFromImageData(data)).toBe(0);
  });

  it('returns 255 for a fully white image', () => {
    const data = new Uint8ClampedArray([255, 255, 255, 255, 255, 255, 255, 255]);
    expect(averageBrightnessFromImageData(data)).toBeCloseTo(255, 5);
  });

  it('weights green more heavily than red or blue (perceptual luminance)', () => {
    const pureGreen = new Uint8ClampedArray([0, 255, 0, 255]);
    const pureBlue = new Uint8ClampedArray([0, 0, 255, 255]);
    expect(averageBrightnessFromImageData(pureGreen)).toBeGreaterThan(
      averageBrightnessFromImageData(pureBlue),
    );
  });

  it('averages across multiple pixels', () => {
    const data = new Uint8ClampedArray([0, 0, 0, 255, 255, 255, 255, 255]);
    expect(averageBrightnessFromImageData(data)).toBeCloseTo(127.5, 0);
  });
});
