import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { config } from './config.js';
import { register, login, getUserFromToken, formatUser } from './auth-simple.js';
import { testConnection, closeConnection } from './database.js';

/**
 * Simple Auth Server
 * 
 * Direct implementation using bcrypt + JWT without Better Auth dependency.
 * Compatible with existing PostgreSQL schema.
 */
const app = new Hono();

// Middleware
app.use('*', logger());

app.use(
  '*',
  cors({
    origin: config.allowedOrigins,
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  })
);

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'auth-server',
    version: '1.0.0',
  });
});

/**
 * Registration endpoint
 * POST /api/auth/register
 */
app.post('/api/auth/register', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, first_name, last_name } = body;

    // Validation
    if (!email || !password || !first_name || !last_name) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Register user
    const { user, token } = await register(email, password, first_name, last_name);

    return c.json({
      token,
      user: formatUser(user),
      expires_at: Math.floor(Date.now() / 1000) + config.jwtExpirationSeconds,
    }, 201);
  } catch (error) {
    console.error('Registration error:', error);
    const message = error instanceof Error ? error.message : 'Registration failed';
    return c.json({ error: message }, 400);
  }
});

/**
 * Login endpoint
 * POST /api/auth/login
 */
app.post('/api/auth/login', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return c.json({ error: 'Missing email or password' }, 400);
    }

    // Login user
    const { user, token } = await login(email, password);

    return c.json({
      token,
      user: formatUser(user),
      expires_at: Math.floor(Date.now() / 1000) + config.jwtExpirationSeconds,
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Invalid credentials' }, 401);
  }
});

/**
 * Get current user endpoint
 * GET /api/auth/me
 */
app.get('/api/auth/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or invalid token' }, 401);
    }

    const token = authHeader.substring(7);
    const user = await getUserFromToken(token);

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    return c.json(formatUser(user));
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ error: 'Unauthorized' }, 401);
  }
});

/**
 * Token refresh endpoint
 * POST /api/auth/refresh
 */
app.post('/api/auth/refresh', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or invalid token' }, 401);
    }

    const token = authHeader.substring(7);
    const user = await getUserFromToken(token);

    if (!user) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    // Generate new token
    const { generateToken } = await import('./auth-simple.js');
    const newToken = generateToken(user);

    return c.json({
      token: newToken,
      expires_at: Math.floor(Date.now() / 1000) + config.jwtExpirationSeconds,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return c.json({ error: 'Token refresh failed' }, 401);
  }
});

/**
 * Logout endpoint
 * POST /api/auth/logout
 */
app.post('/api/auth/logout', async (c) => {
  // For JWT tokens, logout is handled client-side by removing the token
  // Here we just return success
  return c.json({ message: 'Logged out successfully' });
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

// Start server
async function start() {
  try {
    // Test database connection
    console.log('Testing database connection...');
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Failed to connect to database');
      process.exit(1);
    }
    console.log('✅ Database connected');

    // Start server
    console.log(`Starting Auth server on port ${config.port}...`);
    console.log(`Environment: ${config.nodeEnv}`);
    console.log(`CORS origins: ${config.allowedOrigins.join(', ')}`);

    serve({
      fetch: app.fetch,
      port: config.port,
    });

    console.log(`✅ Auth server running at http://localhost:${config.port}`);
    console.log(`✅ Health check: http://localhost:${config.port}/health`);
    console.log(`✅ Auth endpoints: http://localhost:${config.port}/api/auth/*`);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await closeConnection();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await closeConnection();
  process.exit(0);
});

// Start the server
start();

