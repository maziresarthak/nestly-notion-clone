/**
 * Environment variable validation.
 * Validates all required env vars at startup — fail-fast with clear error messages.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`❌ Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}

export const env = {
  DATABASE_URL: requireEnv('DATABASE_URL'),
  JWT_ACCESS_SECRET: requireEnv('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: requireEnv('JWT_REFRESH_SECRET'),
  GOOGLE_CLIENT_ID: requireEnv('GOOGLE_CLIENT_ID'),
  FRONTEND_URL: requireEnv('FRONTEND_URL'),
  PORT: parseInt(process.env.PORT || '3001', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const;
