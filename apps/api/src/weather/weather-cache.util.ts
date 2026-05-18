/** Rounded lat/lon so tiny GPS drift does not invalidate cache. */
export function buildLocationKey(latitude: number, longitude: number): string {
  return `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
}

/** Calendar date in the user's timezone (YYYY-MM-DD). */
export function getLocalDateKey(timezone: string, now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone || 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** Start of next local calendar day as ISO string (for nextAvailableAt). */
export function getNextLocalDayStart(timezone: string, now = new Date()): string {
  const todayKey = getLocalDateKey(timezone, now);
  const probe = new Date(now.getTime() + 36 * 60 * 60 * 1000);
  while (getLocalDateKey(timezone, probe) === todayKey) {
    probe.setTime(probe.getTime() + 60 * 60 * 1000);
  }
  while (getLocalDateKey(timezone, probe) !== todayKey) {
    const prev = new Date(probe.getTime() - 60 * 60 * 1000);
    if (getLocalDateKey(timezone, prev) === todayKey) {
      return probe.toISOString();
    }
    probe.setTime(probe.getTime() - 60 * 60 * 1000);
  }
  return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
}
