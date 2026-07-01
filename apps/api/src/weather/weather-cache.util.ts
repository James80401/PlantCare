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

/**
 * Start (local midnight, to the nearest hour) of the calendar day `daysFromNow` days
 * ahead, in the given timezone. Used anywhere a "due in N days" needs to land on the
 * user's actual calendar day rather than the server's local day.
 */
export function getLocalDayStart(timezone: string, daysFromNow: number, now = new Date()): Date {
  const targetKey = getLocalDateKey(timezone, new Date(now.getTime() + daysFromNow * 24 * 60 * 60 * 1000));
  // Start comfortably past the target day (timezone offsets span at most ±14h from UTC)
  // and walk backward by the hour to find the target day's boundary.
  let probe = new Date(now.getTime() + (daysFromNow + 2) * 24 * 60 * 60 * 1000);
  while (getLocalDateKey(timezone, probe) !== targetKey) {
    probe = new Date(probe.getTime() - 60 * 60 * 1000);
  }
  while (getLocalDateKey(timezone, new Date(probe.getTime() - 60 * 60 * 1000)) === targetKey) {
    probe = new Date(probe.getTime() - 60 * 60 * 1000);
  }
  // Refine to the minute: some timezones (e.g. UTC+5:30) sit on a sub-hour UTC offset,
  // so the hour-granularity boundary above may still be up to 59 minutes into the day.
  while (getLocalDateKey(timezone, new Date(probe.getTime() - 60 * 1000)) === targetKey) {
    probe = new Date(probe.getTime() - 60 * 1000);
  }
  return probe;
}

/** Start of next local calendar day as ISO string (for nextAvailableAt). */
export function getNextLocalDayStart(timezone: string, now = new Date()): string {
  return getLocalDayStart(timezone, 1, now).toISOString();
}
