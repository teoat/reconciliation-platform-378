// Comprehensive Data Persistence Layer
// Handles data storage, backup, recovery, and synchronization

import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'
import { createHash } from 'crypto'

// ============================================================================
// DATABASE SCHEMA DEFINITIONS
// ============================================================================

export interface DatabaseSchema {
  version: string
  tables: TableDefinition[]
  indexes: IndexDefinition[]
  constraints: ConstraintDefinition[]
}

export interface TableDefinition {
  name: string
  columns: ColumnDefinition[]
  primaryKey: string[]
  foreignKeys: ForeignKeyDefinition[]
}

export interface ColumnDefinition {
  name: string
  type: string
  nullable: boolean
  defaultValue?: any
  unique?: boolean
  check?: string
}

export interface ForeignKeyDefinition {
  column: string
  referencedTable: string
  referencedColumn: string
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT'
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT'
}

export interface IndexDefinition {
  name: string
  table: string
  columns: string[]
  unique?: boolean
  partial?: string
}

export interface ConstraintDefinition {
  name: string
  table: string
  type: 'CHECK' | 'UNIQUE' | 'FOREIGN KEY'
  definition: string
}

// ============================================================================
// DATA PERSISTENCE MANAGER
// ============================================================================

export class DataPersistenceManager {
  private pool: Pool
  private schema: DatabaseSchema
  private backupDir: string
  private syncInterval: NodeJS.Timeout | null = null

  constructor(pool: Pool, backupDir: string = './backups') {
    this.pool = pool
    this.backupDir = backupDir
    this.schema = this.getSchemaDefinition()
    
    // Ensure backup directory exists
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true })
    }
  }

  // ============================================================================
  // SCHEMA MANAGEMENT
  // ============================================================================

  private getSchemaDefinition(): DatabaseSchema {
    return {
      version: '1.0.0',
      tables: [
        {
          name: 'users',
          columns: [
            { name: 'id', type: 'UUID', nullable: false, unique: true },
            { name: 'email', type: 'VARCHAR(255)', nullable: false, unique: true },
            { name: 'password_hash', type: 'VARCHAR(255)', nullable: false },
            { name: 'name', type: 'VARCHAR(255)', nullable: false },
            { name: 'role', type: 'VARCHAR(50)', nullable: false, defaultValue: 'user' },
            { name: 'permissions', type: 'JSONB', nullable: false, defaultValue: '[]' },
            { name: 'preferences', type: 'JSONB', nullable: false, defaultValue: '{}' },
            { name: 'created_at', type: 'TIMESTAMP', nullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
            { name: 'updated_at', type: 'TIMESTAMP', nullable: false, defaultValue: 'CURRENT_TIMESTAMP' }
          ],
          primaryKey: ['id'],
          foreignKeys: []
        },
        {
          name: 'projects',
          columns: [
            { name: 'id', type: 'UUID', nullable: false, unique: true },
            { name: 'name', type: 'VARCHAR(255)', nullable: false },
            { name: 'description', type: 'TEXT', nullable: true },
            { name: 'status', type: 'VARCHAR(50)', nullable: false, defaultValue: 'active' },
            { name: 'type', type: 'VARCHAR(100)', nullable: false, defaultValue: 'custom' },
            { name: 'owner_id', type: 'UUID', nullable: false },
            { name: 'settings', type: 'JSONB', nullable: false, defaultValue: '{}' },
            { name: 'data', type: 'JSONB', nullable: false, defaultValue: '{}' },
            { name: 'analytics', type: 'JSONB', nullable: false, defaultValue: '{}' },
            { name: 'created_at', type: 'TIMESTAMP', nullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
            { name: 'updated_at', type: 'TIMESTAMP', nullable: false, defaultValue: 'CURRENT_TIMESTAMP' }
          ],
          primaryKey: ['id'],
          foreignKeys: [
            { column: 'owner_id', referencedTable: 'users', referencedColumn: 'id', onDelete: 'CASCADE' }
          ]
        },
        {
          name: 'project_members',
          columns: [
            { name: 'id', type: 'UUID', nullable: false, unique: true },
            { name: 'project_id', type: 'UUID', nullable: false },
            { name: 'user_id', type: 'UUID', nullable: false },
            { name: 'role', type: 'VARCHAR(50)', nullable: false, defaultValue: 'member' },
            { name: 'permissions', type: 'JSONB', nullable: false, defaultValue: '[]' },
            { name: 'joined_at', type: 'TIMESTAMP', nullable: false, defaultValue: 'CURRENT_TIMESTAMP' }
          ],
          primaryKey: ['id'],
          foreignKeys: [
            { column: 'project_id', referencedTable: 'projects', referencedColumn: 'id', onDelete: 'CASCADE' },
            { column: 'user_id', referencedTable: 'users', referencedColumn: 'id', onDelete: 'CASCADE' }
          ]
        },
        {
          name: 'uploaded_files',
          columns: [
            { name: 'id', type: 'UUID', nullable: false, unique: true },
            { name: 'project_id', type: 'UUID', nullable: false },
            { name: 'filename', type: 'VARCHAR(255)', nullable: false },
            { name: 'original_name', type: 'VARCHAR(255)', nullable: false },
            { name: 'file_path', type: 'VARCHAR(500)', nullable: false },
            { name: 'file_size', type: 'BIGINT', nullable: false },
            { name: 'mime_type', type: 'VARCHAR(100)', nullable: true },
            { name: 'status', type: 'VARCHAR(50)', nullable: false, defaultValue: 'uploaded' },
            { name: 'processed_at', type: 'TIMESTAMP', nullable: true },
            { name: 'error_message', type: 'TEXT', nullable: true },
            { name: 'metadata', type: 'JSONB', nullable: false, defaultValue: '{}' },
            { name: 'created_at', type: 'TIMESTAMP', nullable: false, defaultValue: 'CURRENT_TIMESTAMP' }
          ],
          primaryKey: ['id'],
          foreignKeys: [
            { column: 'project_id', referencedTable: 'projects', referencedColumn: 'id', onDelete: 'CASCADE' }
          ]
        },
        {
          name: 'processed_data',
          columns: [
            { name: 'id', type: 'UUID', nullable: false, unique: true },
            { name: 'file_id', type: 'UUID', nullable: false },
            { name: 'project_id', type: 'UUID', nullable: false },
            { name: 'data', type: 'JSONB', nullable: false },
            { name: 'quality_metrics', type: 'JSONB', nullable: false, defaultValue: '{}' },
            { name: 'validation_results', type: 'JSONB', nullable: false, defaultValue: '[]' },
            { name: 'created_at', type: 'TIMESTAMP', nullable: false, defaultValue: 'CURRENT_TIMESTAMP' }
          ],
          primaryKey: ['id'],
          foreignKeys: [
            { column: 'file_id', referencedTable: 'uploaded_files', referencedColumn: 'id', onDelete: 'CASCADE' },
            { column: 'project_id', referencedTable: 'projects', referencedColumn: 'id', onDelete: 'CASCADE' }
          ]
        },
        {
          name: 'reconciliation_records',
          columns: [
            { name: 'id', type: 'UUID', nullable: false, unique: true },
            { name: 'project_id', type: 'UUID', nullable: false },
            { name: 'status', type: 'VARCHAR(50)', nullable: false, defaultValue: 'pending' },
            { name: 'confidence', type: 'DECIMAL(5,2)', nullable: false, defaultValue: 0 },
            { name: 'match_score', type: 'DECIMAL(5,2)', nullable: false, defaultValue: 0 },
            { name: 'risk_level', type: 'VARCHAR(20)', nullable: false, defaultValue: 'low' },
            { name: 'sources', type: 'JSONB', nullable: false, defaultValue: '[]' },
            { name: 'discrepancies', type: 'JSONB', nullable: false, defaultValue: '[]' },
            { name: 'matching_rules', type: 'JSONB', nullable: false, defaultValue: '[]' },
            { name: 'audit_trail', type: 'JSONB', nullable: false, defaultValue: '[]' },
            { name: 'metadata', type: 'JSONB', nullable: false, defaultValue: '{}' },
            { name: 'created_at', type: 'TIMESTAMP', nullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
            { name: 'updated_at', type: 'TIMESTAMP', nullable: false, defaultValue: 'CURRENT_TIMESTAMP' }
          ],
          primaryKey: ['id'],
          foreignKeys: [
            { column: 'project_id', referencedTable: 'projects', referencedColumn: 'id', onDelete: 'CASCADE' }
          ]
        },
        {
          name: 'audit_entries',
          columns: [
            { name: 'id', type: 'UUID', nullable: false, unique: true },
            { name: 'user_id', type: 'UUID', nullable: true },
            { name: 'project_id', type: 'UUID', nullable: true },
            { name: 'record_id', type: 'UUID', nullable: true },
            { name: 'action', type: 'VARCHAR(100)', nullable: false },
            { name: 'details', type: 'JSONB', nullable: false, defaultValue: '{}' },
            { name: 'ip_address', type: 'INET', nullable: true },
            { name: 'user_agent', type: 'TEXT', nullable: true },
            { name: 'created_at', type: 'TIMESTAMP', nullable: false, defaultValue: 'CURRENT_TIMESTAMP' }
          ],
          primaryKey: ['id'],
          foreignKeys: [
            { column: 'user_id', referencedTable: 'users', referencedColumn: 'id', onDelete: 'SET NULL' },
            { column: 'project_id', referencedTable: 'projects', referencedColumn: 'id', onDelete: 'CASCADE' }
          ]
        },
        {
          name: 'collaboration_sessions',
          columns: [
            { name: 'id', type: 'UUID', nullable: false, unique: true },
            { name: 'project_id', type: 'UUID', nullable: false },
            { name: 'user_id', type: 'UUID', nullable: false },
            { name: 'session_data', type: 'JSONB', nullable: false, defaultValue: '{}' },
            { name: 'last_activity', type: 'TIMESTAMP', nullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
            { name: 'created_at', type: 'TIMESTAMP', nullable: false, defaultValue: 'CURRENT_TIMESTAMP' }
          ],
          primaryKey: ['id'],
          foreignKeys: [
            { column: 'project_id', referencedTable: 'projects', referencedColumn: 'id', onDelete: 'CASCADE' },
            { column: 'user_id', referencedTable: 'users', referencedColumn: 'id', onDelete: 'CASCADE' }
          ]
        },
        {
          name: 'refresh_tokens',
          columns: [
            { name: 'id', type: 'UUID', nullable: false, unique: true },
            { name: 'user_id', type: 'UUID', nullable: false },
            { name: 'token', type: 'VARCHAR(500)', nullable: false },
            { name: 'expires_at', type: 'TIMESTAMP', nullable: false },
            { name: 'created_at', type: 'TIMESTAMP', nullable: false, defaultValue: 'CURRENT_TIMESTAMP' }
          ],
          primaryKey: ['id'],
          foreignKeys: [
            { column: 'user_id', referencedTable: 'users', referencedColumn: 'id', onDelete: 'CASCADE' }
          ]
        }
      ],
      indexes: [
        { name: 'idx_users_email', table: 'users', columns: ['email'], unique: true },
        { name: 'idx_projects_owner', table: 'projects', columns: ['owner_id'] },
        { name: 'idx_projects_status', table: 'projects', columns: ['status'] },
        { name: 'idx_projects_type', table: 'projects', columns: ['type'] },
        { name: 'idx_project_members_project', table: 'project_members', columns: ['project_id'] },
        { name: 'idx_project_members_user', table: 'project_members', columns: ['user_id'] },
        { name: 'idx_project_members_unique', table: 'project_members', columns: ['project_id', 'user_id'], unique: true },
        { name: 'idx_uploaded_files_project', table: 'uploaded_files', columns: ['project_id'] },
        { name: 'idx_uploaded_files_status', table: 'uploaded_files', columns: ['status'] },
        { name: 'idx_processed_data_file', table: 'processed_data', columns: ['file_id'] },
        { name: 'idx_processed_data_project', table: 'processed_data', columns: ['project_id'] },
        { name: 'idx_reconciliation_records_project', table: 'reconciliation_records', columns: ['project_id'] },
        { name: 'idx_reconciliation_records_status', table: 'reconciliation_records', columns: ['status'] },
        { name: 'idx_reconciliation_records_confidence', table: 'reconciliation_records', columns: ['confidence'] },
        { name: 'idx_audit_entries_user', table: 'audit_entries', columns: ['user_id'] },
        { name: 'idx_audit_entries_project', table: 'audit_entries', columns: ['project_id'] },
        { name: 'idx_audit_entries_created', table: 'audit_entries', columns: ['created_at'] },
        { name: 'idx_collaboration_sessions_project', table: 'collaboration_sessions', columns: ['project_id'] },
        { name: 'idx_collaboration_sessions_user', table: 'collaboration_sessions', columns: ['user_id'] },
        { name: 'idx_refresh_tokens_user', table: 'refresh_tokens', columns: ['user_id'] },
        { name: 'idx_refresh_tokens_expires', table: 'refresh_tokens', columns: ['expires_at'] }
      ],
      constraints: [
        { name: 'chk_users_email_format', table: 'users', type: 'CHECK', definition: "email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'" },
        { name: 'chk_projects_status', table: 'projects', type: 'CHECK', definition: "status IN ('active', 'inactive', 'archived', 'deleted')" },
        { name: 'chk_projects_type', table: 'projects', type: 'CHECK', definition: "type IN ('custom', 'template', 'imported')" },
        { name: 'chk_project_members_role', table: 'project_members', type: 'CHECK', definition: "role IN ('owner', 'admin', 'member', 'viewer')" },
        { name: 'chk_uploaded_files_status', table: 'uploaded_files', type: 'CHECK', definition: "status IN ('uploaded', 'processing', 'processed', 'failed')" },
        { name: 'chk_reconciliation_records_status', table: 'reconciliation_records', type: 'CHECK', definition: "status IN ('pending', 'matched', 'unmatched', 'reviewed', 'approved', 'rejected')" },
        { name: 'chk_reconciliation_records_confidence', table: 'reconciliation_records', type: 'CHECK', definition: 'confidence >= 0 AND confidence <= 100' },
        { name: 'chk_reconciliation_records_match_score', table: 'reconciliation_records', type: 'CHECK', definition: 'match_score >= 0 AND match_score <= 100' },
        { name: 'chk_reconciliation_records_risk_level', table: 'reconciliation_records', type: 'CHECK', definition: "risk_level IN ('low', 'medium', 'high', 'critical')" }
      ]
    }
  }

  // Initialize database schema
  async initializeSchema(): Promise<void> {
    try {
      console.log('Initializing database schema...')
      
      // Create tables
      for (const table of this.schema.tables) {
        await this.createTable(table)
      }

      // Create indexes
      for (const index of this.schema.indexes) {
        await this.createIndex(index)
      }

      // Create constraints
      for (const constraint of this.schema.constraints) {
        await this.createConstraint(constraint)
      }

      console.log('Database schema initialized successfully')
    } catch (error) {
      console.error('Failed to initialize database schema:', error)
      throw error
    }
  }

  // Create table
  private async createTable(table: TableDefinition): Promise<void> {
    const columns = table.columns.map(col => {
      let definition = `${col.name} ${col.type}`
      if (!col.nullable) definition += ' NOT NULL'
      if (col.unique) definition += ' UNIQUE'
      if (col.defaultValue !== undefined) {
        definition += ` DEFAULT ${typeof col.defaultValue === 'string' ? `'${col.defaultValue}'` : col.defaultValue}`
      }
      if (col.check) definition += ` CHECK (${col.check})`
      return definition
    }).join(', ')

    const primaryKey = `PRIMARY KEY (${table.primaryKey.join(', ')})`
    const foreignKeys = table.foreignKeys.map(fk => {
      let definition = `FOREIGN KEY (${fk.column}) REFERENCES ${fk.referencedTable}(${fk.referencedColumn})`
      if (fk.onDelete) definition += ` ON DELETE ${fk.onDelete}`
      if (fk.onUpdate) definition += ` ON UPDATE ${fk.onUpdate}`
      return definition
    }).join(', ')

    const constraints = [primaryKey, ...foreignKeys].filter(Boolean)
    const query = `CREATE TABLE IF NOT EXISTS ${table.name} (${columns}, ${constraints.join(', ')})`

    await this.pool.query(query)
  }

  // Create index
  private async createIndex(index: IndexDefinition): Promise<void> {
    const unique = index.unique ? 'UNIQUE ' : ''
    const partial = index.partial ? ` WHERE ${index.partial}` : ''
    const query = `CREATE ${unique}INDEX IF NOT EXISTS ${index.name} ON ${index.table} (${index.columns.join(', ')})${partial}`
    
    await this.pool.query(query)
  }

  // Create constraint
  private async createConstraint(constraint: ConstraintDefinition): Promise<void> {
    const query = `ALTER TABLE ${constraint.table} ADD CONSTRAINT ${constraint.name} ${constraint.type} ${constraint.definition}`
    
    try {
      await this.pool.query(query)
    } catch (error) {
      // Constraint might already exist, ignore error
      if (!error.message.includes('already exists')) {
        throw error
      }
    }
  }

  // ============================================================================
  // DATA BACKUP AND RECOVERY
  // ============================================================================

  // Create full database backup
  async createBackup(backupName?: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const name = backupName || `backup_${timestamp}`
    const backupPath = path.join(this.backupDir, `${name}.sql`)

    try {
      console.log(`Creating backup: ${name}`)
      
      // Get all table data
      const tables = this.schema.tables.map(t => t.name)
      let backupContent = `-- Database Backup: ${name}\n`
      backupContent += `-- Created: ${new Date().toISOString()}\n`
      backupContent += `-- Schema Version: ${this.schema.version}\n\n`

      // Export schema
      backupContent += `-- Schema Export\n`
      for (const table of this.schema.tables) {
        const result = await this.pool.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position
        `, [table.name])
        
        backupContent += `-- Table: ${table.name}\n`
        backupContent += `CREATE TABLE IF NOT EXISTS ${table.name} (\n`
        backupContent += result.rows.map(row => 
          `  ${row.column_name} ${row.data_type}${row.is_nullable === 'NO' ? ' NOT NULL' : ''}${row.column_default ? ` DEFAULT ${row.column_default}` : ''}`
        ).join(',\n')
        backupContent += '\n);\n\n'
      }

      // Export data
      backupContent += `-- Data Export\n`
      for (const table of tables) {
        const result = await this.pool.query(`SELECT * FROM ${table}`)
        if (result.rows.length > 0) {
          backupContent += `-- Data for table: ${table}\n`
          for (const row of result.rows) {
            const columns = Object.keys(row).join(', ')
            const values = Object.values(row).map(val => 
              val === null ? 'NULL' : 
              typeof val === 'string' ? `'${val.replace(/'/g, "''")}'` : 
              val
            ).join(', ')
            backupContent += `INSERT INTO ${table} (${columns}) VALUES (${values});\n`
          }
          backupContent += '\n'
        }
      }

      // Write backup file
      fs.writeFileSync(backupPath, backupContent)
      
      // Create backup metadata
      const metadata = {
        name,
        timestamp: new Date().toISOString(),
        schemaVersion: this.schema.version,
        tables: tables.length,
        totalRecords: await this.getTotalRecordCount(),
        fileSize: fs.statSync(backupPath).size,
        checksum: this.calculateChecksum(backupContent)
      }

      const metadataPath = path.join(this.backupDir, `${name}.metadata.json`)
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))

      console.log(`Backup created successfully: ${backupPath}`)
      return backupPath
    } catch (error) {
      console.error('Backup creation failed:', error)
      throw error
    }
  }

  // Restore database from backup
  async restoreBackup(backupPath: string): Promise<void> {
    try {
      console.log(`Restoring backup: ${backupPath}`)
      
      if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup file not found: ${backupPath}`)
      }

      const backupContent = fs.readFileSync(backupPath, 'utf8')
      
      // Verify backup integrity
      const metadataPath = backupPath.replace('.sql', '.metadata.json')
      if (fs.existsSync(metadataPath)) {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'))
        const currentChecksum = this.calculateChecksum(backupContent)
        if (currentChecksum !== metadata.checksum) {
          throw new Error('Backup file integrity check failed')
        }
      }

      // Execute backup SQL
      const statements = backupContent.split(';').filter(stmt => stmt.trim())
      for (const statement of statements) {
        if (statement.trim()) {
          await this.pool.query(statement.trim())
        }
      }

      console.log('Backup restored successfully')
    } catch (error) {
      console.error('Backup restoration failed:', error)
      throw error
    }
  }

  // Get total record count across all tables
  private async getTotalRecordCount(): Promise<number> {
    let total = 0
    for (const table of this.schema.tables) {
      const result = await this.pool.query(`SELECT COUNT(*) as count FROM ${table.name}`)
      total += parseInt(result.rows[0].count)
    }
    return total
  }

  // Calculate file checksum
  private calculateChecksum(content: string): string {
    return createHash('sha256').update(content).digest('hex')
  }

  // ============================================================================
  // DATA SYNCHRONIZATION
  // ============================================================================

  // Start automatic synchronization
  startSync(intervalMs: number = 300000): void { // 5 minutes default
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }

    this.syncInterval = setInterval(async () => {
      try {
        await this.syncData()
      } catch (error) {
        console.error('Sync failed:', error)
      }
    }, intervalMs)

    console.log(`Data synchronization started (interval: ${intervalMs}ms)`)
  }

  // Stop automatic synchronization
  stopSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
      console.log('Data synchronization stopped')
    }
  }

  // Synchronize data
  private async syncData(): Promise<void> {
    console.log('Starting data synchronization...')
    
    // Clean up expired tokens
    await this.pool.query('DELETE FROM refresh_tokens WHERE expires_at < NOW()')
    
    // Clean up old audit entries (keep last 90 days)
    await this.pool.query('DELETE FROM audit_entries WHERE created_at < NOW() - INTERVAL \'90 days\'')
    
    // Clean up old collaboration sessions (keep last 30 days)
    await this.pool.query('DELETE FROM collaboration_sessions WHERE last_activity < NOW() - INTERVAL \'30 days\'')
    
    // Update project analytics
    await this.updateProjectAnalytics()
    
    console.log('Data synchronization completed')
  }

  // Update project analytics
  private async updateProjectAnalytics(): Promise<void> {
    const projects = await this.pool.query('SELECT id FROM projects WHERE status = $1', ['active'])
    
    for (const project of projects.rows) {
      const analytics = await this.calculateProjectAnalytics(project.id)
      await this.pool.query(
        'UPDATE projects SET analytics = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [analytics, project.id]
      )
    }
  }

  // Calculate project analytics
  private async calculateProjectAnalytics(projectId: string): Promise<any> {
    const [
      fileCount,
      recordCount,
      memberCount,
      lastActivity
    ] = await Promise.all([
      this.pool.query('SELECT COUNT(*) as count FROM uploaded_files WHERE project_id = $1', [projectId]),
      this.pool.query('SELECT COUNT(*) as count FROM reconciliation_records WHERE project_id = $1', [projectId]),
      this.pool.query('SELECT COUNT(*) as count FROM project_members WHERE project_id = $1', [projectId]),
      this.pool.query('SELECT MAX(last_activity) as last_activity FROM collaboration_sessions WHERE project_id = $1', [projectId])
    ])

    return {
      fileCount: parseInt(fileCount.rows[0].count),
      recordCount: parseInt(recordCount.rows[0].count),
      memberCount: parseInt(memberCount.rows[0].count),
      lastActivity: lastActivity.rows[0].last_activity,
      updatedAt: new Date().toISOString()
    }
  }

  // ============================================================================
  // DATA VALIDATION
  // ============================================================================

  // Validate data integrity
  async validateDataIntegrity(): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = []

    try {
      // Check foreign key constraints
      for (const table of this.schema.tables) {
        for (const fk of table.foreignKeys) {
          const result = await this.pool.query(`
            SELECT COUNT(*) as count
            FROM ${table.name} t
            LEFT JOIN ${fk.referencedTable} r ON t.${fk.column} = r.${fk.referencedColumn}
            WHERE t.${fk.column} IS NOT NULL AND r.${fk.referencedColumn} IS NULL
          `)
          
          if (parseInt(result.rows[0].count) > 0) {
            issues.push(`Foreign key constraint violation in ${table.name}.${fk.column}`)
          }
        }
      }

      // Check data consistency
      const consistencyChecks = await this.runConsistencyChecks()
      issues.push(...consistencyChecks)

      return {
        valid: issues.length === 0,
        issues
      }
    } catch (error) {
      issues.push(`Validation error: ${error.message}`)
      return {
        valid: false,
        issues
      }
    }
  }

  // Run consistency checks
  private async runConsistencyChecks(): Promise<string[]> {
    const issues: string[] = []

    // Check for orphaned records
    const orphanedFiles = await this.pool.query(`
      SELECT COUNT(*) as count
      FROM uploaded_files uf
      LEFT JOIN projects p ON uf.project_id = p.id
      WHERE p.id IS NULL
    `)
    
    if (parseInt(orphanedFiles.rows[0].count) > 0) {
      issues.push('Found orphaned uploaded files')
    }

    // Check for invalid JSONB data
    const invalidJsonb = await this.pool.query(`
      SELECT COUNT(*) as count
      FROM projects
      WHERE NOT (settings::text ~ '^[{}]' OR settings::text ~ '^[[]]')
    `)
    
    if (parseInt(invalidJsonb.rows[0].count) > 0) {
      issues.push('Found invalid JSONB data in projects')
    }

    return issues
  }

  // ============================================================================
  // CLEANUP AND MAINTENANCE
  // ============================================================================

  // Clean up old data
  async cleanupOldData(): Promise<void> {
    console.log('Starting data cleanup...')
    
    // Clean up expired refresh tokens
    const expiredTokens = await this.pool.query('DELETE FROM refresh_tokens WHERE expires_at < NOW()')
    console.log(`Cleaned up ${expiredTokens.rowCount} expired refresh tokens`)
    
    // Clean up old audit entries
    const oldAuditEntries = await this.pool.query('DELETE FROM audit_entries WHERE created_at < NOW() - INTERVAL \'90 days\'')
    console.log(`Cleaned up ${oldAuditEntries.rowCount} old audit entries`)
    
    // Clean up old collaboration sessions
    const oldSessions = await this.pool.query('DELETE FROM collaboration_sessions WHERE last_activity < NOW() - INTERVAL \'30 days\'')
    console.log(`Cleaned up ${oldSessions.rowCount} old collaboration sessions`)
    
    console.log('Data cleanup completed')
  }

  // Get database statistics
  async getDatabaseStats(): Promise<any> {
    const stats = {
      tables: {},
      totalSize: 0,
      lastBackup: null,
      lastSync: new Date().toISOString()
    }

    // Get table statistics
    for (const table of this.schema.tables) {
      const [count, size] = await Promise.all([
        this.pool.query(`SELECT COUNT(*) as count FROM ${table.name}`),
        this.pool.query(`
          SELECT pg_size_pretty(pg_total_relation_size('${table.name}')) as size,
                 pg_total_relation_size('${table.name}') as bytes
          FROM ${table.name}
          LIMIT 1
        `)
      ])
      
      stats.tables[table.name] = {
        recordCount: parseInt(count.rows[0].count),
        size: size.rows[0].size,
        bytes: parseInt(size.rows[0].bytes)
      }
      
      stats.totalSize += parseInt(size.rows[0].bytes)
    }

    // Get last backup info
    const backupFiles = fs.readdirSync(this.backupDir).filter(f => f.endsWith('.metadata.json'))
    if (backupFiles.length > 0) {
      const latestBackup = backupFiles.sort().pop()
      const metadata = JSON.parse(fs.readFileSync(path.join(this.backupDir, latestBackup), 'utf8'))
      stats.lastBackup = metadata.timestamp
    }

    return stats
  }

  // Close connection
  async close(): Promise<void> {
    this.stopSync()
    await this.pool.end()
  }
}

export default DataPersistenceManager
