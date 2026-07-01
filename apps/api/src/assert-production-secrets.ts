const REQUIRED_IN_PRODUCTION: Record<string, string> = {
  JWT_SECRET: 'dev-secret',
  JWT_REFRESH_SECRET: 'dev-refresh-secret',
};

/**
 * Refuses to boot in production if a secret is unset, since auth.module.ts,
 * jwt.strategy.ts, and auth.service.ts otherwise silently fall back to hardcoded
 * development values that would let anyone forge tokens.
 */
export function assertProductionSecrets(env: NodeJS.ProcessEnv = process.env): void {
  if (env.NODE_ENV !== 'production') return;

  const missing = Object.keys(REQUIRED_IN_PRODUCTION).filter((key) => !env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(
      `Refusing to start in production without ${missing.join(', ')} set ` +
        '(these fall back to insecure development defaults otherwise).',
    );
  }
}
