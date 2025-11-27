/**
 * Enterprise Security Hook
 */

import { useState, useEffect } from 'react';
import type {
  SecurityPolicy,
  AccessControl,
  AuditLog,
  ComplianceReport,
  SecurityTabId,
} from '../types';
import {
  initializeSamplePolicies,
  initializeSampleAccessControls,
  initializeSampleAuditLogs,
  initializeSampleComplianceReports,
} from '../utils/initializers';

export const useEnterpriseSecurity = (onProgressUpdate?: (step: string) => void) => {
  const [securityPolicies, setSecurityPolicies] = useState<SecurityPolicy[]>([]);
  const [accessControls, setAccessControls] = useState<AccessControl[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([]);
  const [activeTab, setActiveTab] = useState<SecurityTabId>('policies');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    initializeEnterpriseSecurity();
    onProgressUpdate?.('enterprise_security_started');
  }, [onProgressUpdate]);

  const initializeEnterpriseSecurity = () => {
    setSecurityPolicies(initializeSamplePolicies());
    setAccessControls(initializeSampleAccessControls());
    setAuditLogs(initializeSampleAuditLogs());
    setComplianceReports(initializeSampleComplianceReports());
  };

  const handleCreatePolicy = () => {
    setIsCreating(true);
    setTimeout(() => {
      const newPolicy: SecurityPolicy = {
        id: `policy-${Date.now()}`,
        name: 'New Security Policy',
        description: 'New security policy description',
        category: 'access_control',
        rules: [],
        status: 'draft',
        priority: 'medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastReviewed: new Date().toISOString(),
        compliance: {
          gdpr: false,
          sox: false,
          pci: false,
          hipaa: false,
        },
      };
      setSecurityPolicies((prev) => [...prev, newPolicy]);
      setIsCreating(false);
    }, 1000);
  };

  return {
    securityPolicies,
    accessControls,
    auditLogs,
    complianceReports,
    activeTab,
    isCreating,
    setActiveTab,
    handleCreatePolicy,
  };
};

