/** Postgres `contains` is case-sensitive; SQLite LIKE is not. */
export function speciesNameContains(databaseUrl: string, text: string) {
  if (databaseUrl.startsWith('postgresql')) {
    return { contains: text, mode: 'insensitive' as const };
  }
  return { contains: text };
}

export function speciesSearchTerms(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const terms = [trimmed];
  if (/cannibus/i.test(trimmed)) {
    terms.push(trimmed.replace(/cannibus/gi, 'cannabis'));
  }

  return [...new Set(terms)];
}
