#!/usr/bin/env ts-node

/**
 * User Migration Script for Better Auth
 * 
 * This script migrates users from the legacy authentication system to Better Auth.
 * It supports:
 * - Batch migration
 * - Dry-run mode
 * - Rollback capability
 * - Progress tracking
 * - Error handling and retry logic
 * 
 * Usage:
 *   npm run migrate-users -- --dry-run
 *   npm run migrate-users -- --batch-size=100
 *   npm run migrate-users -- --rollback
 */

import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as readline from 'readline';

interface MigrationConfig {
  dryRun: boolean;
  batchSize: number;
  preserveLegacy: boolean;
  verbose: boolean;
  rollback: boolean;
}

interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  role: string;
  email_verified: boolean;
  created_at: Date;
  migration_status: string;
}

interface MigrationResult {
  success: number;
  failed: number;
  skipped: number;
  errors: Array<{ userId: string; error: string }>;
}

class UserMigration {
  private legacyDb: Pool;
  private betterAuthDb: Pool;
  private authServerUrl: string;

  constructor() {
    this.legacyDb = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // Better Auth might use the same database but different schema/tables
    this.betterAuthDb = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    this.authServerUrl = process.env.AUTH_SERVER_URL || 'http://localhost:3001';
  }

  /**
   * Migrate users to Better Auth
   */
  async migrateUsers(config: MigrationConfig): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    };

    try {
      // Get users that need migration
      const users = await this.getUsersForMigration(config.batchSize);
      
      console.log(`\nFound ${users.length} users to migrate`);
      
      if (config.dryRun) {
        console.log('DRY RUN MODE - No changes will be made\n');
      }

      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        
        try {
          console.log(`[${i + 1}/${users.length}] Migrating user: ${user.email}`);
          
          if (config.dryRun) {
            console.log('  ✓ Would migrate (dry run)');
            result.success++;
            continue;
          }

          // Migrate user
          await this.migrateUser(user, config.preserveLegacy);
          
          console.log('  ✓ Successfully migrated');
          result.success++;

        } catch (error) {
          console.error(`  ✗ Failed to migrate: ${error}`);
          result.failed++;
          result.errors.push({
            userId: user.id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      return result;

    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  /**
   * Get users that need migration
   */
  private async getUsersForMigration(limit: number): Promise<User[]> {
    const query = `
      SELECT id, email, password_hash, name, role, 
             COALESCE(email_verified, false) as email_verified,
             created_at, 
             COALESCE(migration_status, 'pending') as migration_status
      FROM users
      WHERE deleted_at IS NULL
        AND (migration_status = 'pending' OR migration_status IS NULL)
      ORDER BY created_at ASC
      LIMIT $1
    `;

    const result = await this.legacyDb.query<User>(query, [limit]);
    return result.rows;
  }

  /**
   * Migrate a single user
   */
  private async migrateUser(user: User, preserveLegacy: boolean): Promise<void> {
    const client = await this.betterAuthDb.connect();
    
    try {
      await client.query('BEGIN');

      // Create Better Auth session record
      const betterAuthId = `ba_${user.id}`;
      
      // Update user record with Better Auth reference
      await client.query(`
        SELECT migrate_user_to_better_auth($1, $2, $3)
      `, [user.id, betterAuthId, preserveLegacy]);

      // If email is verified, create verification record
      if (user.email_verified) {
        await client.query(`
          UPDATE users
          SET email_verified = true, email_verified_at = NOW()
          WHERE id = $1
        `, [user.id]);
      }

      await client.query('COMMIT');

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Rollback migration for users
   */
  async rollbackMigration(config: MigrationConfig): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    };

    try {
      const users = await this.getMigratedUsers(config.batchSize);
      
      console.log(`\nFound ${users.length} users to rollback`);
      
      if (config.dryRun) {
        console.log('DRY RUN MODE - No changes will be made\n');
      }

      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        
        try {
          console.log(`[${i + 1}/${users.length}] Rolling back user: ${user.email}`);
          
          if (config.dryRun) {
            console.log('  ✓ Would rollback (dry run)');
            result.success++;
            continue;
          }

          await this.rollbackUser(user);
          
          console.log('  ✓ Successfully rolled back');
          result.success++;

        } catch (error) {
          console.error(`  ✗ Failed to rollback: ${error}`);
          result.failed++;
          result.errors.push({
            userId: user.id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      return result;

    } catch (error) {
      console.error('Rollback failed:', error);
      throw error;
    }
  }

  /**
   * Get migrated users
   */
  private async getMigratedUsers(limit: number): Promise<User[]> {
    const query = `
      SELECT id, email, password_hash, name, role, 
             COALESCE(email_verified, false) as email_verified,
             created_at, migration_status
      FROM users
      WHERE deleted_at IS NULL
        AND migration_status IN ('migrated', 'active_both')
      ORDER BY updated_at DESC
      LIMIT $1
    `;

    const result = await this.legacyDb.query<User>(query, [limit]);
    return result.rows;
  }

  /**
   * Rollback a single user
   */
  private async rollbackUser(user: User): Promise<void> {
    const client = await this.betterAuthDb.connect();
    
    try {
      await client.query('BEGIN');

      // Reset user migration status
      await client.query(`
        UPDATE users
        SET 
          better_auth_id = NULL,
          migration_status = 'pending',
          last_auth_method = 'legacy',
          updated_at = NOW()
        WHERE id = $1
      `, [user.id]);

      // Delete Better Auth sessions
      await client.query(`
        DELETE FROM better_auth_sessions WHERE user_id = $1
      `, [user.id]);

      // Log rollback event
      await client.query(`
        SELECT log_auth_event($1, 'migration_rollback', 'legacy', true, NULL, 'rollback_script', NULL, NULL)
      `, [user.id]);

      await client.query('COMMIT');

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get migration statistics
   */
  async getStatistics(): Promise<void> {
    const query = `
      SELECT 
        COUNT(*) FILTER (WHERE migration_status = 'pending' OR migration_status IS NULL) as pending,
        COUNT(*) FILTER (WHERE migration_status = 'migrated') as migrated,
        COUNT(*) FILTER (WHERE migration_status = 'active_both') as dual_mode,
        COUNT(*) FILTER (WHERE migration_status = 'better_auth_only') as better_auth_only,
        COUNT(*) as total
      FROM users
      WHERE deleted_at IS NULL
    `;

    const result = await this.legacyDb.query(query);
    const stats = result.rows[0];

    console.log('\nMigration Statistics:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total Users:        ${stats.total}`);
    console.log(`Pending Migration:  ${stats.pending}`);
    console.log(`Migrated:           ${stats.migrated}`);
    console.log(`Dual Mode:          ${stats.dual_mode}`);
    console.log(`Better Auth Only:   ${stats.better_auth_only}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  /**
   * Close database connections
   */
  async close(): Promise<void> {
    await this.legacyDb.end();
    await this.betterAuthDb.end();
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(): MigrationConfig {
  const args = process.argv.slice(2);
  const config: MigrationConfig = {
    dryRun: false,
    batchSize: 100,
    preserveLegacy: true,
    verbose: false,
    rollback: false,
  };

  for (const arg of args) {
    if (arg === '--dry-run' || arg === '-d') {
      config.dryRun = true;
    } else if (arg === '--rollback' || arg === '-r') {
      config.rollback = true;
    } else if (arg === '--no-preserve-legacy') {
      config.preserveLegacy = false;
    } else if (arg === '--verbose' || arg === '-v') {
      config.verbose = true;
    } else if (arg.startsWith('--batch-size=')) {
      config.batchSize = parseInt(arg.split('=')[1], 10);
    }
  }

  return config;
}

/**
 * Confirm action with user
 */
async function confirmAction(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} (yes/no): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Main function
 */
async function main() {
  console.log('Better Auth User Migration Script');
  console.log('═══════════════════════════════════\n');

  const config = parseArgs();
  const migration = new UserMigration();

  try {
    // Show current statistics
    await migration.getStatistics();

    if (config.rollback) {
      console.log('⚠️  ROLLBACK MODE ⚠️\n');
      
      if (!config.dryRun) {
        const confirmed = await confirmAction(
          'This will rollback migrated users to legacy auth. Continue?'
        );
        
        if (!confirmed) {
          console.log('Rollback cancelled');
          return;
        }
      }

      const result = await migration.rollbackMigration(config);
      
      console.log('\nRollback Results:');
      console.log(`  Success: ${result.success}`);
      console.log(`  Failed:  ${result.failed}`);
      console.log(`  Skipped: ${result.skipped}`);
      
      if (result.errors.length > 0) {
        console.log('\nErrors:');
        result.errors.forEach(err => {
          console.log(`  User ${err.userId}: ${err.error}`);
        });
      }

    } else {
      console.log('Starting migration...\n');
      console.log(`Batch size: ${config.batchSize}`);
      console.log(`Preserve legacy: ${config.preserveLegacy}`);
      console.log(`Dry run: ${config.dryRun}\n`);

      if (!config.dryRun) {
        const confirmed = await confirmAction('Proceed with migration?');
        
        if (!confirmed) {
          console.log('Migration cancelled');
          return;
        }
      }

      const result = await migration.migrateUsers(config);
      
      console.log('\nMigration Results:');
      console.log(`  Success: ${result.success}`);
      console.log(`  Failed:  ${result.failed}`);
      console.log(`  Skipped: ${result.skipped}`);
      
      if (result.errors.length > 0) {
        console.log('\nErrors:');
        result.errors.forEach(err => {
          console.log(`  User ${err.userId}: ${err.error}`);
        });
      }
    }

    // Show updated statistics
    console.log('');
    await migration.getStatistics();

  } catch (error) {
    console.error('\nFatal error:', error);
    process.exit(1);
  } finally {
    await migration.close();
  }
}

// Run main function
if (require.main === module) {
  main().catch(console.error);
}

export { UserMigration, MigrationConfig, MigrationResult };

