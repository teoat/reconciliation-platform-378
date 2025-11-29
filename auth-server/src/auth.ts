import { betterAuth } from 'better-auth';
import { config } from './config.js';
import { pool } from './database.js';
import type { User, Session } from 'better-auth/types';

/**
 * Password strength validation matching existing Rust backend rules
 */
function validatePasswordStrength(password: string): { isValid: boolean; feedback: string[] } {
  const feedback: string[] = [];

  if (password.length < config.passwordMinLength) {
    feedback.push(`Password must be at least ${config.passwordMinLength} characters`);
  }
  if (password.length > 128) {
    feedback.push('Password must be no more than 128 characters');
  }
  if (!/[A-Z]/.test(password)) {
    feedback.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    feedback.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    feedback.push('Password must contain at least one number');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    feedback.push('Password must contain at least one special character');
  }
  // Unified banned password list
  const bannedPasswords = [
    'password', 'password123', '123456', '12345678', 'admin123', 'qwerty123',
    'welcome123', 'letmein', 'monkey', 'dragon', 'master', 'abc123', 'qwerty'
  ];
  if (bannedPasswords.some((banned) => password.toLowerCase().includes(banned))) {
    feedback.push('Password is too common');
  }
  // Sequential character check (max 3)
  let sequentialCount = 1;
  const chars = password.split('');
  for (let i = 1; i < chars.length; i++) {
    if (chars[i].charCodeAt(0) === chars[i-1].charCodeAt(0) + 1) {
      sequentialCount++;
      if (sequentialCount > 3) {
        feedback.push('Password contains more than 3 sequential characters');
        break;
      }
    } else {
      sequentialCount = 1;
    }
  }
  // Stub: Password history and expiration checks (to be implemented)
  // feedback.push('Password reuse/history/expiration checks not yet implemented');
  return {
    isValid: feedback.length === 0,
    feedback,
  };
}

/**
 * Custom password validation plugin
 */
const passwordValidationPlugin = {
  id: 'password-validation',
  hooks: {
    user: {
      create: {
        before: async (user: { password?: string }) => {
          if (user.password) {
            const validation = validatePasswordStrength(user.password);
            if (!validation.isValid) {
              throw new Error(`Password validation failed: ${validation.feedback.join(', ')}`);
            }
          }
          return user;
        },
      },
    },
  },
};

/**
 * Better Auth configuration
 * 
 * Configured to work with existing PostgreSQL database schema:
 * - Uses existing users table
 * - Maps status field to role
 * - Preserves bcrypt password hashes
 * - Maintains JWT token format compatibility
 */
export const auth = betterAuth({
  database: {
    // Use standard PostgreSQL adapter
    provider: 'pg',
    url: config.databaseUrl,
  },

  // Email and password authentication
  emailAndPassword: {
    enabled: true,
    // Use bcrypt with cost 12 to match Rust backend
    hashOptions: {
      saltRounds: config.bcryptCost,
    },
    // Require email verification
    requireEmailVerification: false, // Set to true when email service is configured
  },

  // Social providers
  socialProviders: {
    google: config.googleClientId && config.googleClientSecret
      ? {
          clientId: config.googleClientId,
          clientSecret: config.googleClientSecret,
          redirectURI: config.googleRedirectUri || `http://localhost:${config.port}/api/auth/callback/google`,
        }
      : undefined,
  },

  // Session configuration
  session: {
    expiresIn: config.sessionExpirySeconds,
    updateAge: 60 * 60, // Update session every hour
    cookieCache: {
      enabled: true,
      maxAge: config.sessionExpirySeconds,
    },
  },

  // JWT configuration to match existing backend
  jwt: {
    secret: config.jwtSecret,
    expiresIn: config.jwtExpirationSeconds,
    issuer: 'reconciliation-platform',
    audience: 'reconciliation-platform-users',
  },

  // Advanced options
  advanced: {
    // Use existing bcrypt hashes
    useSecureCookies: config.nodeEnv === 'production',
    cookiePrefix: 'better-auth',
    // CSRF protection
    csrfProtection: {
      enabled: true,
      tokenLength: 32,
    },
    // Rate limiting
    rateLimit: {
      enabled: true,
      window: config.rateLimitWindowMs,
      max: config.rateLimitMaxRequests,
    },
  },

  // Plugins
  plugins: [
    passwordValidationPlugin,
  ],

  // Callbacks
  callbacks: {
    // Map user data to match existing API response format
    session: {
      jwt: async ({ session, user }: { session: Session; user: User }) => {
        return {
          ...session,
          user: {
            id: user.id,
            email: user.email,
            first_name: (user.name?.split(' ')[0]) || '',
            last_name: (user.name?.split(' ').slice(1).join(' ')) || '',
            role: (user as any).status || 'user',
            is_active: true,
            last_login: (user as any).last_login || new Date().toISOString(),
          },
        };
      },
    },
  },
});

// Export auth handler
export const authHandler = auth.handler;

// Export types
export type AuthSession = Awaited<ReturnType<typeof auth.api.getSession>>;
export type AuthUser = Awaited<ReturnType<typeof auth.api.getSession>>['user'];

