export interface EnvironmentVariables {
  DATABASE_URL: string;
  PORT: number;
}

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const databaseUrl = config.DATABASE_URL;
  if (typeof databaseUrl !== 'string' || databaseUrl.trim() === '') {
    throw new Error('DATABASE_URL is required');
  }

  const port = Number(config.PORT ?? 3000);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('PORT must be a positive integer');
  }

  return {
    DATABASE_URL: databaseUrl,
    PORT: port,
  };
}
