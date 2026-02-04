import { z } from 'zod';
import dotenv from 'dotenv';
import { ConfigurationError } from '../domain/errors';

// Load environment variables
dotenv.config();

/**
 * Configuration schema with validation
 */
const ConfigSchema = z.object({
  ups: z.object({
    clientId: z.string().min(1, 'UPS_CLIENT_ID is required'),
    clientSecret: z.string().min(1, 'UPS_CLIENT_SECRET is required'),
    accountNumber: z.string().min(1, 'UPS_ACCOUNT_NUMBER is required'),
    apiBaseUrl: z
      .string()
      .url('UPS_API_BASE_URL must be a valid URL')
      .default('https://wwwcie.ups.com/api'),
    oauthUrl: z
      .string()
      .url('UPS_OAUTH_URL must be a valid URL')
      .default('https://wwwcie.ups.com/security/v1/oauth/token'),
  }),
  app: z.object({
    nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
    logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  }),
  rateLimit: z.object({
    maxRequests: z.number().int().positive().default(100),
    windowMs: z.number().int().positive().default(60000), // 1 minute
  }),
});

export type Config = z.infer<typeof ConfigSchema>;

/**
 * Loads and validates configuration from environment variables
 */
export function loadConfig(): Config {
  try {
    return ConfigSchema.parse({
      ups: {
        clientId: process.env.UPS_CLIENT_ID,
        clientSecret: process.env.UPS_CLIENT_SECRET,
        accountNumber: process.env.UPS_ACCOUNT_NUMBER,
        apiBaseUrl: process.env.UPS_API_BASE_URL,
        oauthUrl: process.env.UPS_OAUTH_URL,
      },
      app: {
        nodeEnv: process.env.NODE_ENV,
        logLevel: process.env.LOG_LEVEL,
      },
      rateLimit: {
        maxRequests: process.env.RATE_LIMIT_MAX_REQUESTS
          ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10)
          : undefined,
        windowMs: process.env.RATE_LIMIT_WINDOW_MS
          ? parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10)
          : undefined,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
      throw new ConfigurationError(
        `Configuration validation failed:\n${issues.join('\n')}`,
        error.issues
      );
    }
    throw error;
  }
}

/**
 * Global config instance
 */
export const config = loadConfig();
