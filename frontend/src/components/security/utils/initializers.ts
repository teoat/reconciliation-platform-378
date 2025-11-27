/**
 * Security Initialization Utilities
 */

import type {
  SecurityPolicy,
  AccessControl,
  AuditLog,
  ComplianceReport,
} from '../types';

export const initializeSamplePolicies = (): SecurityPolicy[] => [
  {
    id: 'policy-001',
    name: 'Data Access Control Policy',
    description: 'Controls access to sensitive reconciliation data',
    category: 'access_control',
    rules: [
      {
        id: 'rule-001',
        name: 'Role-based Access',
        description: 'Users can only access data based on their role',
        condition: 'user.role in ["admin", "manager", "analyst"]',
        action: 'allow',
        severity: 'high',
        enabled: true,
      },
      {
        id: 'rule-002',
        name: 'Time-based Access',
        description: 'Access restricted to business hours',
        condition: 'current_time.hour >= 8 AND current_time.hour <= 18',
        action: 'deny',
        severity: 'medium',
        enabled: true,
      },
    ],
    status: 'active',
    priority: 'high',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
    lastReviewed: '2024-01-15T00:00:00Z',
    compliance: {
      gdpr: true,
      sox: true,
      pci: false,
      hipaa: false,
    },
  },
  {
    id: 'policy-002',
    name: 'Data Encryption Policy',
    description: 'Ensures all sensitive data is encrypted',
    category: 'encryption',
    rules: [
      {
        id: 'rule-003',
        name: 'Encrypt at Rest',
        description: 'All data must be encrypted when stored',
        condition: 'data.sensitivity == "high"',
        action: 'allow',
        severity: 'critical',
        enabled: true,
      },
      {
        id: 'rule-004',
        name: 'Encrypt in Transit',
        description: 'All data transmission must use TLS',
        condition: 'protocol != "https"',
        action: 'deny',
        severity: 'critical',
        enabled: true,
      },
    ],
    status: 'active',
    priority: 'critical',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
    lastReviewed: '2024-01-10T00:00:00Z',
    compliance: {
      gdpr: true,
      sox: true,
      pci: true,
      hipaa: true,
    },
  },
];

export const initializeSampleAccessControls = (): AccessControl[] => [
  {
    id: 'access-001',
    userId: 'user-001',
    userName: 'John Smith',
    role: 'admin',
    permissions: ['read', 'write', 'delete', 'admin'],
    resources: ['reconciliation', 'cashflow', 'analytics'],
    lastAccess: new Date(Date.now() - 300000).toISOString(),
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    status: 'active',
  },
  {
    id: 'access-002',
    userId: 'user-002',
    userName: 'Sarah Johnson',
    role: 'manager',
    permissions: ['read', 'write', 'approve'],
    resources: ['reconciliation', 'cashflow'],
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    lastAccess: new Date(Date.now() - 600000).toISOString(),
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    status: 'active',
  },
];

export const initializeSampleAuditLogs = (): AuditLog[] => [
  {
    id: 'audit-001',
    userId: 'user-001',
    userName: 'John Smith',
    action: 'login',
    resource: 'system',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    result: 'success',
    details: { method: 'password', mfa: true },
    riskLevel: 'low',
  },
  {
    id: 'audit-002',
    userId: 'user-002',
    userName: 'Sarah Johnson',
    action: 'view_record',
    resource: 'reconciliation/REC-2023-001',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    result: 'success',
    details: { recordId: 'REC-2023-001', amount: 15000000 },
    riskLevel: 'low',
  },
  {
    id: 'audit-003',
    userId: 'user-003',
    userName: 'Mike Wilson',
    action: 'export_data',
    resource: 'reconciliation',
    timestamp: new Date(Date.now() - 900000).toISOString(),
    ipAddress: '192.168.1.102',
    userAgent: 'curl/7.68.0',
    result: 'blocked',
    details: { reason: 'insufficient_permissions' },
    riskLevel: 'high',
  },
];

export const initializeSampleComplianceReports = (): ComplianceReport[] => [
  {
    id: 'report-001',
    name: 'GDPR Compliance Assessment',
    framework: 'gdpr',
    status: 'compliant',
    score: 95,
    lastAssessment: '2024-01-15T00:00:00Z',
    nextAssessment: '2024-04-15T00:00:00Z',
    findings: [
      {
        id: 'finding-001',
        title: 'Data Processing Lawfulness',
        description: 'All data processing activities have legal basis',
        severity: 'low',
        status: 'resolved',
        dueDate: '2024-01-20T00:00:00Z',
        assignedTo: 'legal-team',
        evidence: ['data-processing-agreements.pdf', 'consent-records.csv'],
      },
    ],
    recommendations: [
      'Continue regular data protection impact assessments',
      'Maintain updated privacy notices',
    ],
  },
];

