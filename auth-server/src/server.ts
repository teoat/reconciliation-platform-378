import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { config } from './config.js';
import { authHandler } from './auth.js';
import { testConnection, closeConnection } from './database.js';

/**
 * Better Auth Server
 * 
 * Provides authentication services for the reconciliation platform:
 * - Email/password authentication
 * - Google OAuth
 * - JWT token management
 * - Session management
 * 
 * Compatible with existing Rust backend and React frontend.
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
    service: 'better-auth-server',
    version: '1.0.0',
  });
});

// Better Auth routes
// All auth endpoints will be under /api/auth/*
app.all('/api/auth/*', async (c) => {
  return authHandler(c.req.raw);
});

// Custom endpoints for backward compatibility

/**
 * Login endpoint (POST /api/auth/login)
 * Maintained for compatibility with existing frontend
 */
app.post('/api/auth/login', async (c) => {
  try {
    const { email, password, remember_me } = await c.req.json();
    
    // Use Better Auth's sign-in method
    const response = await fetch(`http://localhost:${config.port}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const data = await response.json();
    
    // Format response to match existing API
    return c.json({
      token: data.token,
      user: data.user,
      expires_at: Date.now() / 1000 + config.jwtExpirationSeconds,
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Authentication failed' }, 500);
  }
});

/**
 * Register endpoint (POST /api/auth/register)
 * Maintained for compatibility with existing frontend
 */
app.post('/api/auth/register', async (c) => {
  try {
    const { email, password, first_name, last_name, role } = await c.req.json();
    
    // Use Better Auth's sign-up method
    const response = await fetch(`http://localhost:${config.port}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        name: `${first_name} ${last_name}`,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return c.json({ error: error.message || 'Registration failed' }, 400);
    }

    const data = await response.json();
    
    // Format response to match existing API
    return c.json({
      token: data.token,
      user: {
        ...data.user,
        first_name,
        last_name,
        role: role || 'user',
      },
      expires_at: Date.now() / 1000 + config.jwtExpirationSeconds,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ error: 'Registration failed' }, 500);
  }
});

/**
 * Token refresh endpoint (POST /api/auth/refresh)
 * Maintained for compatibility with existing frontend
 */
app.post('/api/auth/refresh', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or invalid token' }, 401);
    }

    const token = authHeader.substring(7);
    
    // Use Better Auth's refresh method
    const response = await fetch(`http://localhost:${config.port}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return c.json({ error: 'Token refresh failed' }, 401);
    }

    const data = await response.json();
    
    return c.json({
      token: data.token,
      expires_at: Date.now() / 1000 + config.jwtExpirationSeconds,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return c.json({ error: 'Token refresh failed' }, 500);
  }
});

/**
 * Google OAuth endpoint (POST /api/auth/google)
 * Maintained for compatibility with existing frontend
 */
app.post('/api/auth/google', async (c) => {
  try {
    const { id_token } = await c.req.json();
    
    // Use Better Auth's Google OAuth method
    const response = await fetch(`http://localhost:${config.port}/api/auth/callback/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: id_token }),
    });

    if (!response.ok) {
      return c.json({ error: 'Google authentication failed' }, 401);
    }

    const data = await response.json();
    
    return c.json({
      token: data.token,
      user: data.user,
      expires_at: Date.now() / 1000 + config.jwtExpirationSeconds,
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    return c.json({ error: 'Google authentication failed' }, 500);
  }
});

/**
 * Get current user endpoint (GET /api/auth/me)
 * Maintained for compatibility with existing frontend
 */
app.get('/api/auth/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or invalid token' }, 401);
    }

    const token = authHeader.substring(7);
    
    // Use Better Auth's session method
    const response = await fetch(`http://localhost:${config.port}/api/auth/session`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const data = await response.json();
    
    return c.json(data.user);
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ error: 'Unauthorized' }, 401);
  }
});

/**
 * Logout endpoint (POST /api/auth/logout)
 * Maintained for compatibility with existing frontend
 */
app.post('/api/auth/logout', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Use Better Auth's sign-out method
      await fetch(`http://localhost:${config.port}/api/auth/sign-out`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    }
    
    return c.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return c.json({ message: 'Logged out successfully' }); // Always return success
  }
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
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('Failed to connect to database');
      process.exit(1);
    }

    // Start server
    console.log(`Starting Better Auth server on port ${config.port}...`);
    console.log(`Environment: ${config.nodeEnv}`);
    console.log(`CORS origins: ${config.allowedOrigins.join(', ')}`);
    
    serve({
      fetch: app.fetch,
      port: config.port,
    });

    console.log(`✅ Better Auth server running at http://localhost:${config.port}`);
    console.log(`✅ Health check: http://localhost:${config.port}/health`);
    console.log(`✅ Auth endpoints: http://localhost:${config.port}/api/auth/*`);
  } catch (error) {
    console.error('Failed to start server:', error);
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

