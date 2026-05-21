/** Postgres `contains` is case-sensitive; SQLite LIKE is not. */
export function speciesNameContains(databaseUrl: string, text: string) {
  if (databaseUrl.startsWith('postgresql')) {
    return { contains: text, mode: 'insensitive' as const };
  }
  return { contains: text };
}
