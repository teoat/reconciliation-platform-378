import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { BetterAuth } from 'better-auth';
import { postgresAdapter } from 'better-auth/adapters/postgres';
import { Pool } from 'pg';
import { emailOTP, googleOAuth } from 'better-auth/plugins';

// Environment variables
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/reconciliation';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

// Database connection
const pool = new Pool({
  connectionString: DATABASE_URL,
});

// Better Auth configuration
const auth = BetterAuth({
  database: postgresAdapter(pool),
  emailAndPassword: {
    enabled: true,
    password: {
      minLength: 8,
      requireSpecialChar: true,
      requireNumber: true,
      requireUppercase: true,
    },
  },
  plugins: [
    emailOTP({
      sendEmail: async ({ email, otp }) => {
        // TODO: Implement email sending
        console.log(`Sending OTP ${otp} to ${email}`);
      },
    }),
    googleOAuth({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: {
    expiresIn: 30 * 60 * 1000, // 30 minutes
    updateAge: 24 * 60 * 60 * 1000, // 24 hours
  },
  baseURL: process.env.BASE_URL || 'http://localhost:4000',
});

// Hono app
const app = new Hono();

// Middleware
app.use(
  '*',
  cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'], // Frontend URLs
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    credentials: true,
  })
);

app.use('*', logger());
app.use('*', prettyJSON());

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount Better Auth routes
app.route('/api/auth', auth);

// Legacy API compatibility routes
app.post('/api/auth/login', async (c) => {
  try {
    const body = await c.req.json();
    const result = await auth.api.signInEmail({
      body: {
        email: body.email,
        password: body.password,
      },
      headers: c.req.header(),
    });
    return c.json(result);
  } catch (error) {
    return c.json({ error: 'Login failed' }, 400);
  }
});

app.post('/api/auth/register', async (c) => {
  try {
    const body = await c.req.json();
    const result = await auth.api.signUpEmail({
      body: {
        email: body.email,
        password: body.password,
        name: `${body.firstName} ${body.lastName}`,
      },
      headers: c.req.header(),
    });
    return c.json(result);
  } catch (error) {
    return c.json({ error: 'Registration failed' }, 400);
  }
});

// Start server
const port = process.env.PORT || 4000;

console.log(`🚀 Auth server starting on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
