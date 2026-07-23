let accessToken: string | null = null;

const LEGACY_AUTH_KEYS = ['accessToken', 'refreshToken'] as const;
const AUTH_LOGOUT_SIGNAL_KEY = 'dr-plant:auth:logout';
const OWNED_EXACT_KEYS = new Set([
  ...LEGACY_AUTH_KEYS,
  AUTH_LOGOUT_SIGNAL_KEY,
  'plantcare_device_push_token',
  'buddy_home_tips_dismissed_v1',
]);
const OWNED_PREFIXES = ['dr-plant:', 'drplant.', 'plantcare_', 'buddy_'];

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function clearLegacyAuthStorage(): void {
  if (typeof window === 'undefined') return;
  for (const key of LEGACY_AUTH_KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Embedded/private clients can deny storage; access auth is memory-only.
    }
  }
}

export function clearDrPlantOwnedStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    const keys = Array.from(
      { length: window.localStorage.length },
      (_, index) => window.localStorage.key(index),
    ).filter((key): key is string => Boolean(key));
    for (const key of keys) {
      if (
        OWNED_EXACT_KEYS.has(key) ||
        OWNED_PREFIXES.some((prefix) => key.startsWith(prefix))
      ) {
        window.localStorage.removeItem(key);
      }
    }
  } catch {
    // Best effort only. Never clear storage owned by another app/site.
  }
}

export function announceAuthLogout(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(AUTH_LOGOUT_SIGNAL_KEY, String(Date.now()));
  } catch {
    // The current tab still logs out even if cross-tab signaling is unavailable.
  }
}

export function subscribeToAuthLogout(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handleStorage = (event: StorageEvent) => {
    if (event.key === AUTH_LOGOUT_SIGNAL_KEY) listener();
  };
  window.addEventListener('storage', handleStorage);
  return () => window.removeEventListener('storage', handleStorage);
}

export function createSingleFlight<T>(operation: () => Promise<T>): () => Promise<T> {
  let active: Promise<T> | null = null;
  return () => {
    if (active) return active;
    active = operation().finally(() => {
      active = null;
    });
    return active;
  };
}
