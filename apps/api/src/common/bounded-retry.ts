import { ConfigService } from '@nestjs/config';

export function providerTimeoutMs(config: ConfigService): number {
  return boundedConfigInt(config, 'OPENAI_TIMEOUT_MS', 60_000, 5_000, 120_000);
}

export function providerMaxRetries(config: ConfigService): number {
  return boundedConfigInt(config, 'OPENAI_MAX_RETRIES', 2, 0, 3);
}

export async function withBoundedRetry<T>(
  operation: () => Promise<T>,
  shouldRetry: (error: unknown) => boolean,
  maxRetries: number,
): Promise<T> {
  let attempt = 0;
  for (;;) {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= maxRetries || !shouldRetry(error)) throw error;
      await delay(attempt === 0 ? 250 : 750);
      attempt += 1;
    }
  }
}

function boundedConfigInt(
  config: ConfigService,
  key: string,
  fallback: number,
  min: number,
  max: number,
): number {
  const parsed = Number.parseInt(config.get<string>(key) ?? '', 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
