// ============================================================================
// RECONCILIATION TYPES
// ============================================================================

import type { ID, Timestamp } from './backend-aligned';
import type { User } from './backend-aligned';

export interface ReconciliationRecord {
  id: ID;
  projectId: ID;
  sourceId: ID;
  targetId: ID;
  sourceSystem: string;
  targetSystem: string;
  amount: number;
  currency: string;
  transactionDate: Timestamp;
  description: string;
  status: ReconciliationStatus;
  matchType?: MatchType;
  confidence?: number;
  discrepancies: Discrepancy[];
  metadata: RecordMetadata;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type ReconciliationStatus = 'matched' | 'unmatched' | 'discrepancy' | 'pending' | 'reviewed';
export type MatchType = 'exact' | 'fuzzy' | 'manual' | 'rule-based';

export interface Discrepancy {
  id: ID;
  type: 'amount' | 'date' | 'description' | 'currency' | 'custom';
  field: string;
  sourceValue: string | number | boolean | Date;
  targetValue: string | number | boolean | Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  resolution?: DiscrepancyResolution;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DiscrepancyResolution {
  type: 'accept' | 'reject' | 'adjust' | 'investigate';
  value?: string | number | boolean | Date;
  reason: string;
  resolvedBy: User;
  resolvedAt: Timestamp;
}

export interface RecordMetadata {
  source: Record<string, unknown>;
  target: Record<string, unknown>;
  computed: Record<string, unknown>;
  tags: string[];
  notes: string[];
}

export interface ReconciliationConfig {
  projectId: ID;
  rules: ReconciliationRule[];
  thresholds: ReconciliationThresholds;
  automation: AutomationConfig;
  notifications: NotificationConfig;
}

export interface ReconciliationRule {
  id: ID;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  conditions: RuleCondition[];
  actions: RuleAction[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface RuleCondition {
  field: string;
  operator:
    | 'equals'
    | 'not_equals'
    | 'contains'
    | 'not_contains'
    | 'greater_than'
    | 'less_than'
    | 'between'
    | 'in'
    | 'not_in';
  value: string | number | boolean | (string | number | boolean)[];
  caseSensitive?: boolean;
}

export interface RuleAction {
  type: 'match' | 'flag' | 'auto_resolve' | 'notify' | 'escalate';
  config: Record<string, unknown>;
}

export interface ReconciliationThresholds {
  amountTolerance: number;
  dateTolerance: number;
  confidenceThreshold: number;
  autoMatchThreshold: number;
}

export interface AutomationConfig {
  enabled: boolean;
  autoMatch: boolean;
  autoResolve: boolean;
  escalationRules: EscalationRule[];
}

export interface EscalationRule {
  condition: string;
  action: 'notify' | 'escalate' | 'pause';
  recipients: User[];
  delay: number;
}

export interface NotificationConfig {
  enabled: boolean;
  channels: NotificationChannel[];
  triggers: NotificationTrigger[];
}

export interface NotificationChannel {
  type: 'email' | 'slack' | 'teams' | 'webhook';
  config: Record<string, unknown>;
}

export interface NotificationTrigger {
  event: 'match' | 'discrepancy' | 'escalation' | 'completion';
  conditions: RuleCondition[];
  recipients: User[];
}

