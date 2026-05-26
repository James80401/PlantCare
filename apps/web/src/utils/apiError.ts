/** Nest / axios error bodies often use `message` as a string or string[]. */
export function formatApiErrorMessage(
  err: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  const message = (err as { response?: { data?: { message?: unknown } } })?.response?.data
    ?.message;
  if (typeof message === 'string' && message.trim()) return message;
  if (Array.isArray(message)) {
    const joined = message.filter((m): m is string => typeof m === 'string').join(' ');
    if (joined.trim()) return joined;
  }
  return fallback;
}
