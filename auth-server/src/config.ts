import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenvConfig();

// Configuration schema
const configSchema = z.object({
  // Server
  port: z.string().default('4000'),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  databaseUrl: z.string(),

  // JWT
  jwtSecret: z.string().min(32),
  jwtExpirationSeconds: z.string().default('1800'),

  // Google OAuth
  googleClientId: z.string().optional(),
  googleClientSecret: z.string().optional(),
  googleRedirectUri: z.string().optional(),

  // Password
  bcryptCost: z.string().default('12'),
  passwordMinLength: z.string().default('8'),
  passwordExpirationDays: z.string().default('90'),

  // Session
  sessionExpirySeconds: z.string().default('1800'),
  refreshTokenExpirySeconds: z.string().default('604800'),

  // Redis
  redisUrl: z.string().optional(),

  // CORS
  corsOrigin: z.string().default('http://localhost:3000'),
  allowedOrigins: z.string().default('http://localhost:3000,http://localhost:2000'),

  // Rate Limiting
  rateLimitMaxRequests: z.string().default('5'),
  rateLimitWindowMs: z.string().default('900000'),

  // Logging
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

// Parse and validate configuration
const rawConfig = {
  port: process.env.PORT,
  nodeEnv: process.env.NODE_ENV,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpirationSeconds: process.env.JWT_EXPIRATION_SECONDS,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI,
  bcryptCost: process.env.BCRYPT_COST,
  passwordMinLength: process.env.PASSWORD_MIN_LENGTH,
  passwordExpirationDays: process.env.PASSWORD_EXPIRATION_DAYS,
  sessionExpirySeconds: process.env.SESSION_EXPIRY_SECONDS,
  refreshTokenExpirySeconds: process.env.REFRESH_TOKEN_EXPIRY_SECONDS,
  redisUrl: process.env.REDIS_URL,
  corsOrigin: process.env.CORS_ORIGIN,
  allowedOrigins: process.env.ALLOWED_ORIGINS,
  rateLimitMaxRequests: process.env.RATE_LIMIT_MAX_REQUESTS,
  rateLimitWindowMs: process.env.RATE_LIMIT_WINDOW_MS,
  logLevel: process.env.LOG_LEVEL,
};

const parsedConfig = configSchema.parse(rawConfig);

// Export typed configuration
export const config = {
  port: parseInt(parsedConfig.port, 10),
  nodeEnv: parsedConfig.nodeEnv,
  databaseUrl: parsedConfig.databaseUrl,
  jwtSecret: parsedConfig.jwtSecret,
  jwtExpirationSeconds: parseInt(parsedConfig.jwtExpirationSeconds, 10),
  googleClientId: parsedConfig.googleClientId,
  googleClientSecret: parsedConfig.googleClientSecret,
  googleRedirectUri: parsedConfig.googleRedirectUri,
  bcryptCost: parseInt(parsedConfig.bcryptCost, 10),
  passwordMinLength: parseInt(parsedConfig.passwordMinLength, 10),
  passwordExpirationDays: parseInt(parsedConfig.passwordExpirationDays, 10),
  sessionExpirySeconds: parseInt(parsedConfig.sessionExpirySeconds, 10),
  refreshTokenExpirySeconds: parseInt(parsedConfig.refreshTokenExpirySeconds, 10),
  redisUrl: parsedConfig.redisUrl,
  corsOrigin: parsedConfig.corsOrigin,
  allowedOrigins: parsedConfig.allowedOrigins.split(',').map((s) => s.trim()),
  rateLimitMaxRequests: parseInt(parsedConfig.rateLimitMaxRequests, 10),
  rateLimitWindowMs: parseInt(parsedConfig.rateLimitWindowMs, 10),
  logLevel: parsedConfig.logLevel,
};

export type Config = typeof config;

