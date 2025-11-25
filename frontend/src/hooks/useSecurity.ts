import { useState, useCallback, useEffect } from 'react';

interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  type: 'access_control' | 'data_encryption' | 'audit_logging' | 'compliance';
  rules: SecurityRule[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SecurityRule {
  id: string;
  name: string;
  condition: string;
  action: 'allow' | 'deny' | 'log' | 'encrypt';
  priority: number;
}

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  result: 'success' | 'failure';
  details?: Record<string, unknown>;
}

interface ComplianceRequirement {
  id: string;
  framework: string;
  requirement: string;
  description: string;
  status: 'compliant' | 'non_compliant' | 'not_applicable';
  lastChecked: string;
}

export const useSecurity = () => {
  const [securityPolicies, setSecurityPolicies] = useState<SecurityPolicy[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [complianceRequirements, setComplianceRequirements] = useState<ComplianceRequirement[]>([]);
  const [isSecurityEnabled, setIsSecurityEnabled] = useState(true);

  // Initialize security policies
  useEffect(() => {
    const policies: SecurityPolicy[] = [
      {
        id: 'policy-1',
        name: 'Data Access Control',
        description: 'Controls access to sensitive reconciliation data',
        type: 'access_control',
        rules: [
          {
            id: 'rule-1',
            name: 'Role-based Access',
            condition: 'user.role in ["admin", "manager"]',
            action: 'allow',
            priority: 1,
          },
          {
            id: 'rule-2',
            name: 'Time-based Access',
            condition: 'current_time between "09:00" and "17:00"',
            action: 'allow',
            priority: 2,
          },
        ],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'policy-2',
        name: 'Data Encryption',
        description: 'Encrypts sensitive data at rest and in transit',
        type: 'data_encryption',
        rules: [
          {
            id: 'rule-3',
            name: 'Encrypt Financial Data',
            condition: 'data.type == "financial"',
            action: 'encrypt',
            priority: 1,
          },
        ],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    setSecurityPolicies(policies);
  }, []);

  // Log audit event
  const logAuditEvent = useCallback(
    (
      userId: string,
      action: string,
      resource: string,
      result: 'success' | 'failure',
      details?: Record<string, unknown>
    ) => {
      const auditLog: AuditLog = {
        id: `audit-${Date.now()}`,
        userId,
        action,
        resource,
        timestamp: new Date().toISOString(),
        ipAddress: '192.168.1.100', // In real app, get from request
        userAgent: 'Mozilla/5.0...', // In real app, get from request
        result,
        details,
      };

      setAuditLogs((prev) => [auditLog, ...prev.slice(0, 999)]); // Keep last 1000
    },
    []
  );

  // Check if user has permission to access resource
  const checkPermission = useCallback(
    (userId: string, resource: string, action: string): boolean => {
      // Log the permission check
      logAuditEvent(userId, `check_permission:${action}`, resource, 'success', {
        action,
        resource,
        timestamp: new Date().toISOString(),
      });

      // Simple permission check logic
      const activePolicies = securityPolicies.filter((p) => p.isActive);

      for (const policy of activePolicies) {
        for (const rule of policy.rules) {
          if (rule.action === 'deny') {
            return false;
          }
          if (rule.action === 'allow') {
            return true;
          }
        }
      }

      return true; // Default allow
    },
    [securityPolicies, logAuditEvent]
  );

  // Encrypt sensitive data
  const encryptData = useCallback(
    <T>(
      data: T,
      dataType: string
    ): T & { _encrypted: boolean; _encryptionType: string; _encryptedAt: string } => {
      if (!isSecurityEnabled) return data;

      // Simple encryption simulation
      const encryptedData = {
        ...data,
        _encrypted: true,
        _encryptionType: 'AES-256',
        _encryptedAt: new Date().toISOString(),
      };

      logAuditEvent('system', 'encrypt_data', dataType, 'success', {
        dataType,
        encryptedAt: new Date().toISOString(),
      });

      return encryptedData;
    },
    [isSecurityEnabled, logAuditEvent]
  );

  // Decrypt sensitive data
  const decryptData = useCallback(
    <T>(encryptedData: T & { _encrypted?: boolean }, dataType: string): T => {
      if (!isSecurityEnabled || !encryptedData._encrypted) return encryptedData;

      // Simple decryption simulation
      const decryptedData = { ...encryptedData } as T & { _encrypted?: boolean; _encryptionType?: string; _encryptedAt?: string };
      delete decryptedData._encrypted;
      delete decryptedData._encryptionType;
      delete decryptedData._encryptedAt;

      logAuditEvent('system', 'decrypt_data', dataType, 'success', {
        dataType,
        decryptedAt: new Date().toISOString(),
      });

      return decryptedData;
    },
    [isSecurityEnabled, logAuditEvent]
  );

  // Check compliance status
  const checkCompliance = useCallback(
    (framework: string): ComplianceRequirement[] => {
      const requirements = complianceRequirements.filter((req) => req.framework === framework);

      logAuditEvent('system', 'compliance_check', framework, 'success', {
        framework,
        requirementsCount: requirements.length,
        checkedAt: new Date().toISOString(),
      });

      return requirements;
    },
    [complianceRequirements, logAuditEvent]
  );

  // Create security policy
  const createSecurityPolicy = useCallback(
    (policy: Omit<SecurityPolicy, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newPolicy: SecurityPolicy = {
        ...policy,
        id: `policy-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setSecurityPolicies((prev) => [...prev, newPolicy]);

      logAuditEvent('admin', 'create_security_policy', newPolicy.name, 'success', {
        policyId: newPolicy.id,
        policyName: newPolicy.name,
        createdAt: new Date().toISOString(),
      });

      return newPolicy;
    },
    [logAuditEvent]
  );

  // Update security policy
  const updateSecurityPolicy = useCallback(
    (policyId: string, updates: Partial<SecurityPolicy>) => {
      setSecurityPolicies((prev) =>
        prev.map((policy) =>
          policy.id === policyId
            ? { ...policy, ...updates, updatedAt: new Date().toISOString() }
            : policy
        )
      );

      logAuditEvent('admin', 'update_security_policy', policyId, 'success', {
        policyId,
        updates,
        updatedAt: new Date().toISOString(),
      });
    },
    [logAuditEvent]
  );

  // Delete security policy
  const deleteSecurityPolicy = useCallback(
    (policyId: string) => {
      setSecurityPolicies((prev) => prev.filter((policy) => policy.id !== policyId));

      logAuditEvent('admin', 'delete_security_policy', policyId, 'success', {
        policyId,
        deletedAt: new Date().toISOString(),
      });
    },
    [logAuditEvent]
  );

  // Export audit logs
  const exportAuditLogs = useCallback(
    (format: 'csv' | 'json' = 'json') => {
      const logs = auditLogs.map((log) => ({
        id: log.id,
        userId: log.userId,
        action: log.action,
        resource: log.resource,
        timestamp: log.timestamp,
        ipAddress: log.ipAddress,
        result: log.result,
        details: log.details,
      }));

      logAuditEvent('admin', 'export_audit_logs', format, 'success', {
        format,
        logsCount: logs.length,
        exportedAt: new Date().toISOString(),
      });

      if (format === 'csv') {
        const csvContent = [
          'ID,User ID,Action,Resource,Timestamp,IP Address,Result,Details',
          ...logs.map(
            (log) =>
              `${log.id},${log.userId},${log.action},${log.resource},${log.timestamp},${log.ipAddress},${log.result},"${JSON.stringify(log.details)}"`
          ),
        ].join('\n');

        return csvContent;
      } else {
        return JSON.stringify(logs, null, 2);
      }
    },
    [auditLogs, logAuditEvent]
  );

  return {
    securityPolicies,
    auditLogs,
    complianceRequirements,
    isSecurityEnabled,
    setIsSecurityEnabled,
    checkPermission,
    logAuditEvent,
    encryptData,
    decryptData,
    checkCompliance,
    createSecurityPolicy,
    updateSecurityPolicy,
    deleteSecurityPolicy,
    exportAuditLogs,
  };
};
