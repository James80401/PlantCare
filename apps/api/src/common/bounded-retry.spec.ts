import { withBoundedRetry } from './bounded-retry';

describe('withBoundedRetry', () => {
  it('retries a bounded number of transient failures', async () => {
    const operation = jest
      .fn<Promise<string>, []>()
      .mockRejectedValueOnce(new Error('temporary'))
      .mockResolvedValue('ok');

    await expect(
      withBoundedRetry(operation, () => true, 2),
    ).resolves.toBe('ok');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('does not retry a permanent failure', async () => {
    const operation = jest
      .fn<Promise<string>, []>()
      .mockRejectedValue(new Error('permanent'));

    await expect(
      withBoundedRetry(operation, () => false, 3),
    ).rejects.toThrow('permanent');
    expect(operation).toHaveBeenCalledTimes(1);
  });
});
