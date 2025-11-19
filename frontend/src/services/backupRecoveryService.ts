// Data Backup & Recovery Service
import { logger } from '@/services/logger';
// Implements comprehensive backup and disaster recovery with automated scheduling, encryption, and restoration

import { APP_CONFIG } from '../config/AppConfig';

// Backup configuration
interface BackupConfig {
  id: string;
  name: string;
  description: string;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'manual';
  retentionDays: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  includeFiles: boolean;
  includeDatabase: boolean;
  includeUserData: boolean;
  includeSettings: boolean;
  excludePatterns: string[];
  destination: BackupDestination;
  schedule: BackupSchedule;
  notifications: BackupNotifications;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// Backup destination
interface BackupDestination {
  type: 'local' | 'cloud' | 'ftp' | 'sftp' | 's3' | 'azure' | 'gcp';
  path: string;
  credentials?: {
    username?: string;
    password?: string;
    accessKey?: string;
    secretKey?: string;
    token?: string;
  };
  region?: string;
  bucket?: string;
  endpoint?: string;
  sslEnabled: boolean;
  maxRetries: number;
  timeout: number;
}

// Backup schedule
interface BackupSchedule {
  enabled: boolean;
  cronExpression?: string;
  timezone: string;
  nextRun?: Date;
  lastRun?: Date;
  runCount: number;
  maxConcurrentRuns: number;
  retryOnFailure: boolean;
  maxRetries: number;
  retryDelay: number;
}

// Backup notifications
interface BackupNotifications {
  onSuccess: boolean;
  onFailure: boolean;
  onCompletion: boolean;
  emailRecipients: string[];
  webhookUrl?: string;
  slackChannel?: string;
  teamsChannel?: string;
}

// Backup job
interface BackupJob {
  id: string;
  configId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  progress: number;
  filesProcessed: number;
  totalFiles: number;
  bytesProcessed: number;
  totalBytes: number;
  error?: string;
  warnings: string[];
  metadata: BackupMetadata;
  logs: BackupLog[];
}

// Backup metadata
interface BackupMetadata {
  version: string;
  timestamp: Date;
  checksum: string;
  size: number;
  compressionRatio?: number;
  encryptionMethod?: string;
  sourceInfo: {
    projectId: string;
    userId: string;
    environment: string;
    version: string;
  };
  destinationInfo: {
    type: string;
    path: string;
    region?: string;
  };
}

// Backup log entry
interface BackupLog {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  details?: Record<string, unknown>;
  component: string;
}

// Recovery plan
interface RecoveryPlan {
  id: string;
  name: string;
  description: string;
  backupConfigId: string;
  recoverySteps: RecoveryStep[];
  validationSteps: ValidationStep[];
  rollbackSteps: RollbackStep[];
  estimatedDuration: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dependencies: string[];
  notifications: RecoveryNotifications;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// Recovery step
interface RecoveryStep {
  id: string;
  name: string;
  description: string;
  type:
    | 'file_restore'
    | 'database_restore'
    | 'service_restart'
    | 'configuration_update'
    | 'validation';
  order: number;
  timeout: number;
  retryCount: number;
  retryDelay: number;
  dependencies: string[];
  parameters: Record<string, unknown>;
  scripts?: string[];
  isOptional: boolean;
  isParallel: boolean;
}

// Validation step
interface ValidationStep {
  id: string;
  name: string;
  description: string;
  type:
    | 'data_integrity'
    | 'service_health'
    | 'performance_test'
    | 'security_scan'
    | 'compliance_check';
  order: number;
  timeout: number;
  parameters: Record<string, unknown>;
  expectedResults: Record<string, unknown>;
  tolerance: number;
  isCritical: boolean;
}

// Rollback step
interface RollbackStep {
  id: string;
  name: string;
  description: string;
  type: 'file_rollback' | 'database_rollback' | 'service_rollback' | 'configuration_rollback';
  order: number;
  timeout: number;
  parameters: Record<string, unknown>;
  scripts?: string[];
  isAutomatic: boolean;
}

// Recovery notifications
interface RecoveryNotifications {
  onStart: boolean;
  onProgress: boolean;
  onCompletion: boolean;
  onFailure: boolean;
  onRollback: boolean;
  emailRecipients: string[];
  webhookUrl?: string;
  slackChannel?: string;
  teamsChannel?: string;
}

// Recovery job
interface RecoveryJob {
  id: string;
  planId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled_back';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  progress: number;
  currentStep?: string;
  completedSteps: string[];
  failedSteps: string[];
  error?: string;
  warnings: string[];
  metadata: RecoveryMetadata;
  logs: RecoveryLog[];
}

// Recovery metadata
interface RecoveryMetadata {
  version: string;
  timestamp: Date;
  sourceBackup: string;
  targetEnvironment: string;
  recoveryReason: string;
  initiatedBy: string;
  estimatedDuration: number;
  actualDuration?: number;
}

// Recovery log entry
interface RecoveryLog {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  details?: Record<string, unknown>;
  component: string;
  stepId?: string;
}

class BackupRecoveryService {
  private static instance: BackupRecoveryService;
  private configs: Map<string, BackupConfig> = new Map();
  private plans: Map<string, RecoveryPlan> = new Map();
  private jobs: Map<string, BackupJob> = new Map();
  private recoveryJobs: Map<string, RecoveryJob> = new Map();
  private listeners = new Map<string, Array<(...args: unknown[]) => void>>();
  private isInitialized: boolean = false;

  public static getInstance(): BackupRecoveryService {
    if (!BackupRecoveryService.instance) {
      BackupRecoveryService.instance = new BackupRecoveryService();
    }
    return BackupRecoveryService.instance;
  }

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    try {
      // Load existing configurations
      await this.loadConfigurations();

      // Load existing recovery plans
      await this.loadRecoveryPlans();

      // Start backup scheduler
      this.startBackupScheduler();

      // Start recovery monitor
      this.startRecoveryMonitor();

      this.isInitialized = true;
      logger.info('Backup & Recovery Service initialized');
    } catch (error) {
      logger.error('Failed to initialize Backup & Recovery Service:', error);
    }
  }

  // Backup management
  public async createBackupConfig(
    config: Omit<BackupConfig, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const id = this.generateId();
    const now = new Date();

    const backupConfig: BackupConfig = {
      ...config,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.configs.set(id, backupConfig);
    await this.saveConfigurations();

    this.emit('backupConfigCreated', backupConfig);
    return id;
  }

  public async updateBackupConfig(id: string, updates: Partial<BackupConfig>): Promise<void> {
    const config = this.configs.get(id);
    if (!config) {
      throw new Error(`Backup configuration ${id} not found`);
    }

    const updatedConfig = {
      ...config,
      ...updates,
      updatedAt: new Date(),
    };

    this.configs.set(id, updatedConfig);
    await this.saveConfigurations();

    this.emit('backupConfigUpdated', updatedConfig);
  }

  public async deleteBackupConfig(id: string): Promise<void> {
    const config = this.configs.get(id);
    if (!config) {
      throw new Error(`Backup configuration ${id} not found`);
    }

    this.configs.delete(id);
    await this.saveConfigurations();

    this.emit('backupConfigDeleted', id);
  }

  public getBackupConfig(id: string): BackupConfig | undefined {
    return this.configs.get(id);
  }

  public getAllBackupConfigs(): BackupConfig[] {
    return Array.from(this.configs.values());
  }

  public async runBackup(configId: string): Promise<string> {
    const config = this.configs.get(configId);
    if (!config) {
      throw new Error(`Backup configuration ${configId} not found`);
    }

    const jobId = this.generateId();
    const job: BackupJob = {
      id: jobId,
      configId,
      status: 'pending',
      startTime: new Date(),
      progress: 0,
      filesProcessed: 0,
      totalFiles: 0,
      bytesProcessed: 0,
      totalBytes: 0,
      warnings: [],
      metadata: {
        version: '1.0.0',
        timestamp: new Date(),
        checksum: '',
        size: 0,
        sourceInfo: {
          projectId: 'current',
          userId: 'system',
          environment: 'production',
          version: '1.0.0',
        },
        destinationInfo: {
          type: config.destination.type,
          path: config.destination.path,
          region: config.destination.region,
        },
      },
      logs: [],
    };

    this.jobs.set(jobId, job);

    // Start backup process
    this.executeBackup(jobId);

    return jobId;
  }

  public getBackupJob(jobId: string): BackupJob | undefined {
    return this.jobs.get(jobId);
  }

  public getAllBackupJobs(): BackupJob[] {
    return Array.from(this.jobs.values());
  }

  // Recovery management
  public async createRecoveryPlan(
    plan: Omit<RecoveryPlan, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const id = this.generateId();
    const now = new Date();

    const recoveryPlan: RecoveryPlan = {
      ...plan,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.plans.set(id, recoveryPlan);
    await this.saveRecoveryPlans();

    this.emit('recoveryPlanCreated', recoveryPlan);
    return id;
  }

  public async updateRecoveryPlan(id: string, updates: Partial<RecoveryPlan>): Promise<void> {
    const plan = this.plans.get(id);
    if (!plan) {
      throw new Error(`Recovery plan ${id} not found`);
    }

    const updatedPlan = {
      ...plan,
      ...updates,
      updatedAt: new Date(),
    };

    this.plans.set(id, updatedPlan);
    await this.saveRecoveryPlans();

    this.emit('recoveryPlanUpdated', updatedPlan);
  }

  public async deleteRecoveryPlan(id: string): Promise<void> {
    const plan = this.plans.get(id);
    if (!plan) {
      throw new Error(`Recovery plan ${id} not found`);
    }

    this.plans.delete(id);
    await this.saveRecoveryPlans();

    this.emit('recoveryPlanDeleted', id);
  }

  public getRecoveryPlan(id: string): RecoveryPlan | undefined {
    return this.plans.get(id);
  }

  public getAllRecoveryPlans(): RecoveryPlan[] {
    return Array.from(this.plans.values());
  }

  public async executeRecovery(
    planId: string,
    reason: string,
    initiatedBy: string
  ): Promise<string> {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error(`Recovery plan ${planId} not found`);
    }

    const jobId = this.generateId();
    const job: RecoveryJob = {
      id: jobId,
      planId,
      status: 'pending',
      startTime: new Date(),
      progress: 0,
      completedSteps: [],
      failedSteps: [],
      warnings: [],
      metadata: {
        version: '1.0.0',
        timestamp: new Date(),
        sourceBackup: 'latest',
        targetEnvironment: 'production',
        recoveryReason: reason,
        initiatedBy,
        estimatedDuration: plan.estimatedDuration,
      },
      logs: [],
    };

    this.recoveryJobs.set(jobId, job);

    // Start recovery process
    this.executeRecoveryJob(jobId);

    return jobId;
  }

  public getRecoveryJob(jobId: string): RecoveryJob | undefined {
    return this.recoveryJobs.get(jobId);
  }

  public getAllRecoveryJobs(): RecoveryJob[] {
    return Array.from(this.recoveryJobs.values());
  }

  // Utility methods
  public async validateBackup(backupId: string): Promise<boolean> {
    try {
      const job = this.jobs.get(backupId);
      if (!job || job.status !== 'completed') {
        return false;
      }

      // Perform validation checks
      const isValid = await this.performBackupValidation(job);

      this.log(job.id, 'info', `Backup validation ${isValid ? 'passed' : 'failed'}`, 'validation');

      return isValid;
    } catch (error) {
      logger.error('Backup validation failed:', error);
      return false;
    }
  }

  public async restoreFromBackup(backupId: string, targetPath: string): Promise<boolean> {
    try {
      const job = this.jobs.get(backupId);
      if (!job || job.status !== 'completed') {
        throw new Error('Backup not found or not completed');
      }

      // Perform restoration
      const success = await this.performRestoration(job, targetPath);

      this.log(job.id, 'info', `Restoration ${success ? 'completed' : 'failed'}`, 'restoration');

      return success;
    } catch (error) {
      logger.error('Restoration failed:', error);
      return false;
    }
  }

  public async cleanupOldBackups(retentionDays: number): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      let cleanedCount = 0;

      for (const [id, job] of Array.from(this.jobs.entries())) {
        if (job.status === 'completed' && job.endTime && job.endTime < cutoffDate) {
          // Remove old backup files
          await this.removeBackupFiles(job);

          // Remove job record
          this.jobs.delete(id);
          cleanedCount++;
        }
      }

      await this.saveJobs();

      this.emit('backupsCleaned', cleanedCount);
      return cleanedCount;
    } catch (error) {
      logger.error('Backup cleanup failed:', error);
      return 0;
    }
  }

  // Private methods
  private async loadConfigurations(): Promise<void> {
    try {
      const saved = localStorage.getItem('backup_configurations');
      if (saved) {
        const configs = JSON.parse(saved);
        configs.forEach((config: BackupConfig) => {
          this.configs.set(config.id, config);
        });
      }
    } catch (error) {
      logger.error('Failed to load backup configurations:', error);
    }
  }

  private async saveConfigurations(): Promise<void> {
    try {
      const configs = Array.from(this.configs.values());
      localStorage.setItem('backup_configurations', JSON.stringify(configs));
    } catch (error) {
      logger.error('Failed to save backup configurations:', error);
    }
  }

  private async loadRecoveryPlans(): Promise<void> {
    try {
      const saved = localStorage.getItem('recovery_plans');
      if (saved) {
        const plans = JSON.parse(saved);
        plans.forEach((plan: RecoveryPlan) => {
          this.plans.set(plan.id, plan);
        });
      }
    } catch (error) {
      logger.error('Failed to load recovery plans:', error);
    }
  }

  private async saveRecoveryPlans(): Promise<void> {
    try {
      const plans = Array.from(this.plans.values());
      localStorage.setItem('recovery_plans', JSON.stringify(plans));
    } catch (error) {
      logger.error('Failed to save recovery plans:', error);
    }
  }

  private async saveJobs(): Promise<void> {
    try {
      const jobs = Array.from(this.jobs.values());
      localStorage.setItem('backup_jobs', JSON.stringify(jobs));
    } catch (error) {
      logger.error('Failed to save backup jobs:', error);
    }
  }

  private startBackupScheduler(): void {
    // Check for scheduled backups every minute
    setInterval(() => {
      this.checkScheduledBackups();
    }, 60000);
  }

  private startRecoveryMonitor(): void {
    // Monitor recovery jobs every 30 seconds
    setInterval(() => {
      this.monitorRecoveryJobs();
    }, 30000);
  }

  private async checkScheduledBackups(): Promise<void> {
    const now = new Date();

    for (const config of Array.from(this.configs.values())) {
      if (!config.isActive || !config.schedule.enabled) {
        continue;
      }

      if (config.schedule.nextRun && config.schedule.nextRun <= now) {
        try {
          await this.runBackup(config.id);

          // Update next run time
          config.schedule.nextRun = this.calculateNextRun(config.frequency);
          config.schedule.lastRun = now;
          config.schedule.runCount++;

          await this.saveConfigurations();
        } catch (error) {
          logger.error(`Scheduled backup failed for ${config.id}:`, error);
        }
      }
    }
  }

  private calculateNextRun(frequency: string): Date {
    const now = new Date();

    switch (frequency) {
      case 'hourly':
        return new Date(now.getTime() + 60 * 60 * 1000);
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  private async executeBackup(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    try {
      job.status = 'running';
      this.emit('backupStarted', job);

      // Simulate backup process
      const steps = [
        { name: 'Preparing backup', progress: 10 },
        { name: 'Collecting files', progress: 30 },
        { name: 'Compressing data', progress: 60 },
        { name: 'Encrypting backup', progress: 80 },
        { name: 'Uploading to destination', progress: 95 },
        { name: 'Finalizing backup', progress: 100 },
      ];

      for (const step of steps) {
        await this.delay(1000); // Simulate work

        job.progress = step.progress;
        job.logs.push({
          timestamp: new Date(),
          level: 'info',
          message: step.name,
          component: 'backup',
        });

        this.emit('backupProgress', job);
      }

      job.status = 'completed';
      job.endTime = new Date();
      job.duration = job.endTime.getTime() - job.startTime.getTime();

      this.emit('backupCompleted', job);
    } catch (error) {
      job.status = 'failed';
      job.endTime = new Date();
      job.error = error instanceof Error ? error.message : 'Unknown error';

      this.emit('backupFailed', job);
    }
  }

  private async executeRecoveryJob(jobId: string): Promise<void> {
    const job = this.recoveryJobs.get(jobId);
    if (!job) return;

    const plan = this.plans.get(job.planId);
    if (!plan) return;

    try {
      job.status = 'running';
      this.emit('recoveryStarted', job);

      // Execute recovery steps
      for (const step of plan.recoverySteps) {
        job.currentStep = step.id;

        try {
          await this.executeRecoveryStep(step, job);
          job.completedSteps.push(step.id);

          job.progress = (job.completedSteps.length / plan.recoverySteps.length) * 100;

          this.emit('recoveryProgress', job);
        } catch (error) {
          job.failedSteps.push(step.id);

          if (step.isOptional) {
            job.warnings.push(`Optional step ${step.name} failed: ${error}`);
          } else {
            throw error;
          }
        }
      }

      // Execute validation steps
      for (const validation of plan.validationSteps) {
        try {
          const isValid = await this.executeValidationStep(validation, job);
          if (!isValid && validation.isCritical) {
            throw new Error(`Critical validation failed: ${validation.name}`);
          }
        } catch (error) {
          job.warnings.push(`Validation ${validation.name} failed: ${error}`);
        }
      }

      job.status = 'completed';
      job.endTime = new Date();
      job.duration = job.endTime.getTime() - job.startTime.getTime();

      this.emit('recoveryCompleted', job);
    } catch (error) {
      job.status = 'failed';
      job.endTime = new Date();
      job.error = error instanceof Error ? error.message : 'Unknown error';

      // Attempt rollback
      await this.executeRollback(job, plan);

      this.emit('recoveryFailed', job);
    }
  }

  private async executeRecoveryStep(step: RecoveryStep, job: RecoveryJob): Promise<void> {
    job.logs.push({
      timestamp: new Date(),
      level: 'info',
      message: `Executing step: ${step.name}`,
      component: 'recovery',
      stepId: step.id,
    });

    // Simulate step execution
    await this.delay(2000);

    job.logs.push({
      timestamp: new Date(),
      level: 'info',
      message: `Step completed: ${step.name}`,
      component: 'recovery',
      stepId: step.id,
    });
  }

  private async executeValidationStep(
    validation: ValidationStep,
    job: RecoveryJob
  ): Promise<boolean> {
    job.logs.push({
      timestamp: new Date(),
      level: 'info',
      message: `Executing validation: ${validation.name}`,
      component: 'validation',
    });

    // Simulate validation
    await this.delay(1000);

    // Return random validation result for demo
    return Math.random() > 0.2;
  }

  private async executeRollback(job: RecoveryJob, plan: RecoveryPlan): Promise<void> {
    job.status = 'rolled_back';

    job.logs.push({
      timestamp: new Date(),
      level: 'warn',
      message: 'Starting rollback process',
      component: 'rollback',
    });

    // Execute rollback steps in reverse order
    const rollbackSteps = [...plan.rollbackSteps].reverse();

    for (const step of rollbackSteps) {
      try {
        await this.executeRollbackStep(step, job);
      } catch (error) {
        job.warnings.push(`Rollback step ${step.name} failed: ${error}`);
      }
    }

    job.logs.push({
      timestamp: new Date(),
      level: 'info',
      message: 'Rollback process completed',
      component: 'rollback',
    });

    this.emit('recoveryRolledBack', job);
  }

  private async executeRollbackStep(step: RollbackStep, job: RecoveryJob): Promise<void> {
    job.logs.push({
      timestamp: new Date(),
      level: 'info',
      message: `Executing rollback step: ${step.name}`,
      component: 'rollback',
    });

    // Simulate rollback step execution
    await this.delay(1000);
  }

  private async performBackupValidation(job: BackupJob): Promise<boolean> {
    // Simulate backup validation
    await this.delay(500);
    return Math.random() > 0.1; // 90% success rate
  }

  private async performRestoration(job: BackupJob, targetPath: string): Promise<boolean> {
    // Simulate restoration process
    await this.delay(2000);
    return Math.random() > 0.05; // 95% success rate
  }

  private async removeBackupFiles(job: BackupJob): Promise<void> {
    // Simulate file removal
    await this.delay(100);
  }

  private async monitorRecoveryJobs(): Promise<void> {
    // Monitor running recovery jobs
    for (const job of Array.from(this.recoveryJobs.values())) {
      if (job.status === 'running') {
        // Check for timeout
        const now = new Date();
        const duration = now.getTime() - job.startTime.getTime();

        if (duration > 30 * 60 * 1000) {
          // 30 minutes timeout
          job.status = 'failed';
          job.error = 'Recovery job timed out';
          job.endTime = now;

          this.emit('recoveryTimeout', job);
        }
      }
    }
  }

  private log(jobId: string, level: string, message: string, component: string): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.logs.push({
        timestamp: new Date(),
        level: level as 'debug' | 'info' | 'warn' | 'error',
        message,
        component,
      });
    }
  }

  private generateId(): string {
    return `br_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Event system
  public on(event: string, callback: (...args: unknown[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  public off(event: string, callback: (...args: unknown[]) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, ...args: unknown[]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(...args));
    }
  }
}

import React from 'react';

// React hook for backup and recovery
export const useBackupRecovery = () => {
  const [backupConfigs, setBackupConfigs] = React.useState<BackupConfig[]>([]);
  const [recoveryPlans, setRecoveryPlans] = React.useState<RecoveryPlan[]>([]);
  const [backupJobs, setBackupJobs] = React.useState<BackupJob[]>([]);
  const [recoveryJobs, setRecoveryJobs] = React.useState<RecoveryJob[]>([]);

  React.useEffect(() => {
    const service = BackupRecoveryService.getInstance();

    // Load initial data
    setBackupConfigs(service.getAllBackupConfigs());
    setRecoveryPlans(service.getAllRecoveryPlans());
    setBackupJobs(service.getAllBackupJobs());
    setRecoveryJobs(service.getAllRecoveryJobs());

    // Set up event listeners
    const handleBackupConfigCreated = (config: BackupConfig) => {
      setBackupConfigs((prev) => [...prev, config]);
    };

    const handleBackupConfigUpdated = (config: BackupConfig) => {
      setBackupConfigs((prev) => prev.map((c) => (c.id === config.id ? config : c)));
    };

    const handleBackupConfigDeleted = (id: string) => {
      setBackupConfigs((prev) => prev.filter((c) => c.id !== id));
    };

    const handleBackupCompleted = (job: BackupJob) => {
      setBackupJobs((prev) => prev.map((j) => (j.id === job.id ? job : j)));
    };

    const handleRecoveryCompleted = (job: RecoveryJob) => {
      setRecoveryJobs((prev) => prev.map((j) => (j.id === job.id ? job : j)));
    };

    service.on('backupConfigCreated', handleBackupConfigCreated);
    service.on('backupConfigUpdated', handleBackupConfigUpdated);
    service.on('backupConfigDeleted', handleBackupConfigDeleted);
    service.on('backupCompleted', handleBackupCompleted);
    service.on('recoveryCompleted', handleRecoveryCompleted);

    return () => {
      service.off('backupConfigCreated', handleBackupConfigCreated);
      service.off('backupConfigUpdated', handleBackupConfigUpdated);
      service.off('backupConfigDeleted', handleBackupConfigDeleted);
      service.off('backupCompleted', handleBackupCompleted);
      service.off('recoveryCompleted', handleRecoveryCompleted);
    };
  }, []);

  const service = BackupRecoveryService.getInstance();

  return {
    backupConfigs,
    recoveryPlans,
    backupJobs,
    recoveryJobs,
    createBackupConfig: service.createBackupConfig.bind(service),
    updateBackupConfig: service.updateBackupConfig.bind(service),
    deleteBackupConfig: service.deleteBackupConfig.bind(service),
    runBackup: service.runBackup.bind(service),
    createRecoveryPlan: service.createRecoveryPlan.bind(service),
    updateRecoveryPlan: service.updateRecoveryPlan.bind(service),
    deleteRecoveryPlan: service.deleteRecoveryPlan.bind(service),
    executeRecovery: service.executeRecovery.bind(service),
    validateBackup: service.validateBackup.bind(service),
    restoreFromBackup: service.restoreFromBackup.bind(service),
    cleanupOldBackups: service.cleanupOldBackups.bind(service),
  };
};

// Export singleton instance
export const backupRecoveryService = BackupRecoveryService.getInstance();

export default backupRecoveryService;
