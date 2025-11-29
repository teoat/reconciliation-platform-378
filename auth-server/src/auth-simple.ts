import { compare, hash } from '@node-rs/bcrypt';
import jwt from 'jsonwebtoken';
import { query } from './database.js';
import { config } from './config.js';
import type { Context } from 'hono';

interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  status: string;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

interface TokenPayload {
  user_id: string;
  email: string;
  role: string;
}

/**
 * Generate JWT token
 */
export function generateToken(user: User): string {
  const payload: TokenPayload = {
    user_id: user.id,
    email: user.email,
    role: user.status,
  };

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpirationSeconds,
    issuer: 'reconciliation-platform',
    audience: 'reconciliation-platform-users',
  });
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, config.jwtSecret, {
      issuer: 'reconciliation-platform',
      audience: 'reconciliation-platform-users',
    }) as TokenPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Register new user
 */
export async function register(
  email: string,
  password: string,
  firstName: string,
  lastName: string
): Promise<{ user: User; token: string }> {
  // Check if user exists
  const existing = await query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );

  if (existing.rows.length > 0) {
    throw new Error('User already exists');
  }

  // Hash password
  const passwordHash = await hash(password, config.bcryptCost);

  // Create user
  const name = `${firstName} ${lastName}`;
  const result = await query(
    `INSERT INTO users (email, password_hash, name, first_name, last_name, status, email_verified, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
     RETURNING *`,
    [email, passwordHash, name, firstName, lastName, 'active', true]
  );

  const user = result.rows[0] as User;
  const token = generateToken(user);

  return { user, token };
}

/**
 * Login user
 */
export async function login(
  email: string,
  password: string
): Promise<{ user: User; token: string }> {
  // Get user
  const result = await query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid credentials');
  }

  const user = result.rows[0] as User;

  // Verify password
  const isValid = await compare(password, user.password_hash);

  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  // Update last login
  await query(
    'UPDATE users SET last_login_at = NOW() WHERE id = $1',
    [user.id]
  );

  const token = generateToken(user);

  return { user, token };
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const result = await query(
    'SELECT * FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0] as User;
}

/**
 * Get user from token
 */
export async function getUserFromToken(token: string): Promise<User | null> {
  const payload = verifyToken(token);

  if (!payload) {
    return null;
  }

  return getUserById(payload.user_id);
}

/**
 * Auth middleware
 */
export async function authMiddleware(c: Context, next: () => Promise<void>) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.substring(7);
  const user = await getUserFromToken(token);

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Store user in context
  c.set('user', user);

  await next();
}

/**
 * Format user for API response (remove sensitive fields)
 */
export function formatUser(user: User) {
  const { password_hash, ...userWithoutPassword } = user;
  return {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    name: `${user.first_name} ${user.last_name}`,
    role: user.status,
    is_active: user.status === 'active',
    email_verified: user.email_verified,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

