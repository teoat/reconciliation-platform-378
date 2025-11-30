import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { jwt } from 'hono/jwt';

const app = new Hono();

// Middleware
app.use(
  '*',
  cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    credentials: true,
  })
);

app.use('*', logger());

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Mock user database
const users: any[] = [
  {
    id: 1,
    email: 'admin@example.com',
    password: 'password123', // In production, hash passwords
    name: 'Admin User',
    role: 'admin',
  },
  {
    id: 2,
    email: 'user@example.com',
    password: 'password123',
    name: 'Regular User',
    role: 'user',
  },
];

// Helper function to create JWT
function createToken(user: any) {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
  };

  // Simple JWT creation (in production, use a proper JWT library)
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payloadStr = btoa(JSON.stringify(payload));
  const signature = btoa('signature'); // Mock signature

  return `${header}.${payloadStr}.${signature}`;
}

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Login endpoint
app.post('/api/auth/login', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    const user = users.find((u) => u.email === email && u.password === password);

    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const token = createToken(user);

    return c.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    return c.json({ error: 'Login failed' }, 500);
  }
});

// Register endpoint
app.post('/api/auth/register', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, firstName, lastName } = body;

    // Check if user already exists
    const existingUser = users.find((u) => u.email === email);
    if (existingUser) {
      return c.json({ error: 'User already exists' }, 400);
    }

    // Create new user
    const newUser = {
      id: users.length + 1,
      email,
      password, // In production, hash this
      name: `${firstName} ${lastName}`,
      role: 'user',
    };

    users.push(newUser);
    const token = createToken(newUser);

    return c.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
      token,
    });
  } catch (error) {
    return c.json({ error: 'Registration failed' }, 500);
  }
});

// Get current user endpoint
app.get('/api/auth/me', async (c) => {
  try {
    // In a real implementation, you'd verify the JWT token here
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Mock user - in production, decode and verify JWT
    const mockUser = users[0]; // Return first user as mock

    return c.json({
      success: true,
      user: {
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
      },
    });
  } catch (error) {
    return c.json({ error: 'Failed to get user' }, 500);
  }
});

// Logout endpoint
app.post('/api/auth/logout', async (c) => {
  return c.json({ success: true, message: 'Logged out successfully' });
});

const port = process.env.PORT || 4000;

console.log(`🚀 Auth server starting on port ${port}`);
console.log(`📧 Test users:`);
console.log(`   Admin: admin@example.com / password123`);
console.log(`   User: user@example.com / password123`);

serve({
  fetch: app.fetch,
  port: Number(port),
});
