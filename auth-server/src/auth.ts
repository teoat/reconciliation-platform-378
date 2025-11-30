import { betterAuth } from 'better-auth';
import { config } from './config.js';
import { pool } from './database.js';
import type { User, Session } from 'better-auth/types';

// Add observability helpers
const logPasswordPolicyFailure = (reason: string, details?: any) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    event: 'password_policy_failure',
    reason,
    ...details,
  }));
};

const logAuthEvent = (event: string, details?: any) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    event,
    ...details,
  }));
};

/**
 * Check if password was previously used
 */
async function isPasswordInHistory(userId: string, newPasswordHash: string): Promise<boolean> {
  const historyLimit = config.passwordHistoryLimit;
  const result = await pool.query(
    `SELECT password_hash FROM password_history 
     WHERE user_id = $1 
     ORDER BY created_at DESC 
     LIMIT $2`,
    [userId, historyLimit]
  );
  
  // In real implementation, compare hashes using bcrypt.compare
  // For now, just check exact match (simplified)
  return result.rows.some(row => row.password_hash === newPasswordHash);
}

/**
 * Password strength validation matching existing Rust backend rules
 */
async function validatePasswordStrength(
  password: string, 
  userId?: string,
  passwordHash?: string
): Promise<{ isValid: boolean; feedback: string[] }> {
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
  
  // Password history check (if userId and hash provided)
  if (userId && passwordHash) {
    const inHistory = await isPasswordInHistory(userId, passwordHash);
    if (inHistory) {
      feedback.push(`Password was previously used. Please choose a different password (last ${config.passwordHistoryLimit} passwords are tracked)`);
    }
  }
  
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
            const validation = await validatePasswordStrength(user.password);
            if (!validation.isValid) {
              logPasswordPolicyFailure('validation_failed', {
                feedback: validation.feedback,
                email: (user as any).email,
              });
              throw new Error(`Password validation failed: ${validation.feedback.join(', ')}`);
            }
            logAuthEvent('password_validated', { email: (user as any).email });
          }
          return user;
        },
        after: async (user: any) => {
          // Set password tracking fields
          const now = new Date();
          const expiryDays = config.passwordExpirationDays;
          const expiryDate = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000);
          
          // Update user with password tracking
          await pool.query(
            'UPDATE "user" SET password_last_changed = $1, password_expires_at = $2 WHERE id = $3',
            [now, expiryDate, user.id]
          );
          
          // Store password in history
          if (user.password) {
            await pool.query(
              'INSERT INTO password_history (user_id, password_hash) VALUES ($1, $2)',
              [user.id, user.password]
            );
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
        // Check password expiry
        const userResult = await pool.query(
          'SELECT password_expires_at, password_last_changed FROM "user" WHERE id = $1',
          [user.id]
        );
        
        if (userResult.rows.length > 0) {
          const { password_expires_at } = userResult.rows[0];
          
          if (password_expires_at) {
            const now = new Date();
            const expiryDate = new Date(password_expires_at);
            
            if (expiryDate < now) {
              logAuthEvent('password_expired', { 
                userId: user.id,
                email: user.email,
                expiredAt: password_expires_at
              });
              
              // Return session with password_expired flag
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
                  password_expired: true,
                  password_expires_at: password_expires_at,
                },
              };
            }
          }
        }
        
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

