export type LightLevel = 'low' | 'medium' | 'high';

export interface LightReading {
  /** Average perceptual brightness of the sampled pixels, 0–255. */
  brightness: number;
  level: LightLevel;
}

// A phone camera auto-exposes, so this is a relative brightness read, not a
// calibrated lux meter — thresholds are tuned to separate a clearly dim
// room from a clearly bright, sunlit one, not to hit exact lux figures.
const LOW_MEDIUM_THRESHOLD = 70;
const MEDIUM_HIGH_THRESHOLD = 160;

export function levelForBrightness(brightness: number): LightLevel {
  if (brightness < LOW_MEDIUM_THRESHOLD) return 'low';
  if (brightness < MEDIUM_HIGH_THRESHOLD) return 'medium';
  return 'high';
}

/** Perceptual (not simple-average) luminance per channel, matching how
 *  humans weight green much more heavily than blue. */
function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function averageBrightnessFromImageData(data: Uint8ClampedArray): number {
  let total = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    total += relativeLuminance(data[i], data[i + 1], data[i + 2]);
    count += 1;
  }
  if (count === 0) return 0;
  return total / count;
}

/** Reads a captured photo's average brightness by downsampling it onto a
 *  small offscreen canvas (cheap regardless of the source photo's
 *  resolution) and sampling every pixel of that canvas. */
export async function estimateLightLevelFromImage(file: Blob): Promise<LightReading> {
  const bitmap = await createImageBitmap(file);
  const SAMPLE_SIZE = 64;
  const canvas = document.createElement('canvas');
  canvas.width = SAMPLE_SIZE;
  canvas.height = SAMPLE_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not supported in this browser.');
  ctx.drawImage(bitmap, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
  const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
  const brightness = averageBrightnessFromImageData(data);
  return { brightness, level: levelForBrightness(brightness) };
}
