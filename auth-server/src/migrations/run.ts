import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { query, testConnection, closeConnection } from '../database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Run database migrations for Better Auth compatibility
 */
async function runMigrations() {
  try {
    console.log('Starting database migrations...');

    // Test connection
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Failed to connect to database');
    }

    // Create migrations tracking table
    await query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Get executed migrations
    const executedMigrations = await query<{ migration: string }>(
      'SELECT migration FROM schema_migrations ORDER BY migration'
    );
    const executedMigrationNames = executedMigrations.rows.map((row) => row.migration);

    // Migrations to run
    const migrations = [
      '001_better_auth_compat.sql',
    ];

    // Run pending migrations
    for (const migration of migrations) {
      if (executedMigrationNames.includes(migration)) {
        console.log(`⏭️  Skipping migration ${migration} (already executed)`);
        continue;
      }

      console.log(`▶️  Running migration ${migration}...`);

      // Read migration file
      const migrationPath = join(__dirname, migration);
      const migrationSQL = readFileSync(migrationPath, 'utf-8');

      // Execute migration
      await query(migrationSQL);

      // Record migration
      await query('INSERT INTO schema_migrations (migration) VALUES ($1)', [migration]);

      console.log(`✅ Migration ${migration} completed`);
    }

    console.log('\n✅ All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await closeConnection();
  }
}

// Run migrations if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { runMigrations };

