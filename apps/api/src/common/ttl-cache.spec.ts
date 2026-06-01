import { TtlCache } from './ttl-cache';

describe('TtlCache', () => {
  it('returns a cached value within the TTL and recomputes after expiry', async () => {
    jest.useFakeTimers();
    const cache = new TtlCache<number>(1000);
    const factory = jest.fn().mockResolvedValue(42);

    expect(await cache.getOrSet('k', factory)).toBe(42);
    expect(await cache.getOrSet('k', factory)).toBe(42);
    expect(factory).toHaveBeenCalledTimes(1); // served from cache

    jest.advanceTimersByTime(1001);
    factory.mockResolvedValue(99);
    expect(await cache.getOrSet('k', factory)).toBe(99); // recomputed
    expect(factory).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });

  it('clear() drops all entries', async () => {
    const cache = new TtlCache<string>(10_000);
    await cache.getOrSet('a', async () => 'x');
    await cache.getOrSet('b', async () => 'y');
    expect(cache.size).toBe(2);
    cache.clear();
    expect(cache.size).toBe(0);
  });

  it('delete() removes a single key', async () => {
    const cache = new TtlCache<string>(10_000);
    await cache.getOrSet('a', async () => 'x');
    cache.delete('a');
    expect(cache.get('a')).toBeUndefined();
  });
});
