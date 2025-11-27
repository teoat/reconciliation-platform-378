/**
 * Enterprise Security Hook
 * Updated to use API services
 */

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/services/logger';
import { securityApiService } from '@/services/securityApiService';
import type {
  SecurityPolicy,
  AccessControl,
  AuditLog,
  ComplianceReport,
  SecurityTab,
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
  const [activeTab, setActiveTab] = useState<SecurityTab>('policies');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data from API
  const loadSecurityData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Load all security data in parallel
      const [policiesRes, accessRes, auditRes, complianceRes] = await Promise.allSettled([
        securityApiService.getPolicies(),
        securityApiService.getAccessControls(),
        securityApiService.getAuditLogs(),
        securityApiService.getComplianceReports(),
      ]);

      if (policiesRes.status === 'fulfilled' && policiesRes.value.success) {
        setSecurityPolicies(policiesRes.value.data || []);
      } else {
        // Fallback to sample data
        setSecurityPolicies(initializeSamplePolicies());
      }

      if (accessRes.status === 'fulfilled' && accessRes.value.success) {
        setAccessControls(accessRes.value.data || []);
      } else {
        setAccessControls(initializeSampleAccessControls());
      }

      if (auditRes.status === 'fulfilled' && auditRes.value.success) {
        setAuditLogs(auditRes.value.data?.logs || []);
      } else {
        setAuditLogs(initializeSampleAuditLogs());
      }

      if (complianceRes.status === 'fulfilled' && complianceRes.value.success) {
        setComplianceReports(complianceRes.value.data || []);
      } else {
        setComplianceReports(initializeSampleComplianceReports());
      }
    } catch (error) {
      logger.error('Error loading security data', { error });
      setError('Failed to load security data');
      // Fallback to sample data
      setSecurityPolicies(initializeSamplePolicies());
      setAccessControls(initializeSampleAccessControls());
      setAuditLogs(initializeSampleAuditLogs());
      setComplianceReports(initializeSampleComplianceReports());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSecurityData();
    onProgressUpdate?.('enterprise_security_started');
  }, [loadSecurityData, onProgressUpdate]);

  const handleCreatePolicy = useCallback(async () => {
    setIsCreating(true);
    try {
      const response = await securityApiService.createPolicy({
        name: 'New Security Policy',
        description: 'New security policy description',
        category: 'access_control',
        rules: [],
        priority: 'medium',
        compliance: {
          gdpr: false,
          sox: false,
          pci: false,
          hipaa: false,
        },
      });

      if (response.success && response.data) {
        setSecurityPolicies((prev) => [...prev, response.data!]);
        logger.info('Policy created successfully', { policyId: response.data.id });
      }
    } catch (error) {
      logger.error('Error creating policy', { error });
      // Create local policy as fallback
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
    } finally {
      setIsCreating(false);
    }
  }, []);

  const updatePolicy = useCallback(async (policy: SecurityPolicy) => {
    try {
      const response = await securityApiService.updatePolicy({
        id: policy.id,
        name: policy.name,
        description: policy.description,
        category: policy.category,
        rules: policy.rules,
        priority: policy.priority,
        status: policy.status,
        compliance: policy.compliance,
      });

      if (response.success && response.data) {
        setSecurityPolicies((prev) =>
          prev.map((p) => (p.id === policy.id ? response.data! : p))
        );
        return response.data;
      }
    } catch (error) {
      logger.error('Error updating policy', { error });
      throw error;
    }
  }, []);

  const deletePolicy = useCallback(async (policyId: string) => {
    try {
      await securityApiService.deletePolicy(policyId);
      setSecurityPolicies((prev) => prev.filter((p) => p.id !== policyId));
    } catch (error) {
      logger.error('Error deleting policy', { error });
      throw error;
    }
  }, []);

  return {
    securityPolicies,
    accessControls,
    auditLogs,
    complianceReports,
    activeTab,
    isCreating,
    isLoading,
    error,
    setActiveTab,
    handleCreatePolicy,
    updatePolicy,
    deletePolicy,
    loadSecurityData,
  };
};
