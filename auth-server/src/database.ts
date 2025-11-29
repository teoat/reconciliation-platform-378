import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;

/**
 * PostgreSQL database connection pool
 * 
 * Connects to existing reconciliation database with users table:
 * - id (UUID)
 * - email (VARCHAR)
 * - password_hash (VARCHAR)
 * - first_name (VARCHAR)
 * - last_name (VARCHAR)
 * - status (VARCHAR) - maps to role in Better Auth
 * - created_at (TIMESTAMP)
 * - updated_at (TIMESTAMP)
 * - last_login (TIMESTAMP)
 * - password_last_changed (TIMESTAMP)
 * - password_expires_at (TIMESTAMP)
 */
export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Test connection on startup
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('Database connected successfully:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

/**
 * Close database connection pool
 */
export async function closeConnection(): Promise<void> {
  await pool.end();
  console.log('Database connection pool closed');
}

/**
 * Execute a query
 */
export async function query<T = any>(text: string, params?: any[]): Promise<pg.QueryResult<T>> {
  const start = Date.now();
  const result = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  
  if (config.logLevel === 'debug') {
    console.log('Executed query', { text, duration, rows: result.rowCount });
  }
  
  return result;
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient(): Promise<pg.PoolClient> {
  return await pool.connect();
}

