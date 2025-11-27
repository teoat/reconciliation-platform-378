/**
 * Enterprise Security Types
 */

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  category: 'access_control' | 'data_protection' | 'audit' | 'compliance' | 'encryption';
  rules: SecurityRule[];
  status: 'active' | 'inactive' | 'draft';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
  lastReviewed: string;
  compliance: {
    gdpr: boolean;
    sox: boolean;
    pci: boolean;
    hipaa: boolean;
  };
}

export interface SecurityRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  action: 'allow' | 'deny' | 'log' | 'alert';
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

export interface AccessControl {
  id: string;
  userId: string;
  userName: string;
  role: string;
  permissions: string[];
  resources: string[];
  expiresAt?: string;
  lastAccess: string;
  ipAddress: string;
  userAgent: string;
  status: 'active' | 'expired' | 'revoked';
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  result: 'success' | 'failure' | 'blocked';
  details: Record<string, unknown>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface ComplianceReport {
  id: string;
  name: string;
  framework: 'gdpr' | 'sox' | 'pci' | 'hipaa' | 'iso27001';
  status: 'compliant' | 'non_compliant' | 'partial' | 'pending';
  score: number;
  lastAssessment: string;
  nextAssessment: string;
  findings: ComplianceFinding[];
  recommendations: string[];
}

export interface ComplianceFinding {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'accepted';
  dueDate: string;
  assignedTo: string;
  evidence: string[];
}

export type SecurityTab = 'policies' | 'access' | 'audit' | 'compliance';
export type SecurityTabId = SecurityTab; // Alias for backward compatibility

export interface EnterpriseSecurityProps {
  project: import('../../../services/apiClient/types').BackendProject;
  onProgressUpdate?: (step: string) => void;
}

