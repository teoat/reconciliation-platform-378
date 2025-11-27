/**
 * Security API Service
 * Handles all API calls related to enterprise security
 */

import { apiClient, type ApiResponse } from './apiClient';
import type {
  SecurityPolicy,
  AccessControl,
  AuditLog,
  ComplianceReport,
  SecurityRule,
} from '../components/security/types';

export interface CreatePolicyRequest {
  name: string;
  description: string;
  category: SecurityPolicy['category'];
  rules: SecurityRule[];
  priority: SecurityPolicy['priority'];
  compliance: SecurityPolicy['compliance'];
}

export interface UpdatePolicyRequest extends Partial<CreatePolicyRequest> {
  id: string;
  status?: SecurityPolicy['status'];
}

export interface UpdateAccessControlRequest {
  id: string;
  permissions?: string[];
  resources?: string[];
  expiresAt?: string;
  status?: AccessControl['status'];
}

export interface SecurityScanRequest {
  scope?: 'full' | 'policies' | 'access' | 'compliance';
  options?: Record<string, unknown>;
}

export interface SecurityScanResponse {
  scanId: string;
  status: 'running' | 'completed' | 'failed';
  results?: {
    vulnerabilities: Array<{
      id: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      title: string;
      description: string;
      recommendation: string;
    }>;
    compliance: {
      gdpr: number;
      sox: number;
      pci: number;
      hipaa: number;
    };
    summary: {
      totalIssues: number;
      criticalIssues: number;
      highIssues: number;
    };
  };
}

class SecurityApiService {
  /**
   * Get all security policies
   */
  async getPolicies(): Promise<ApiResponse<SecurityPolicy[]>> {
    return apiClient.makeRequest<SecurityPolicy[]>('/api/security/policies', {
      method: 'GET',
      cache: true,
    });
  }

  /**
   * Get a single policy by ID
   */
  async getPolicy(policyId: string): Promise<ApiResponse<SecurityPolicy>> {
    return apiClient.makeRequest<SecurityPolicy>(`/api/security/policies/${policyId}`, {
      method: 'GET',
      cache: true,
    });
  }

  /**
   * Create a new security policy
   */
  async createPolicy(data: CreatePolicyRequest): Promise<ApiResponse<SecurityPolicy>> {
    return apiClient.makeRequest<SecurityPolicy>('/api/security/policies', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Update an existing policy
   */
  async updatePolicy(data: UpdatePolicyRequest): Promise<ApiResponse<SecurityPolicy>> {
    return apiClient.makeRequest<SecurityPolicy>(`/api/security/policies/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Delete a policy
   */
  async deletePolicy(policyId: string): Promise<ApiResponse<void>> {
    return apiClient.makeRequest<void>(`/api/security/policies/${policyId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get all access controls
   */
  async getAccessControls(): Promise<ApiResponse<AccessControl[]>> {
    return apiClient.makeRequest<AccessControl[]>('/api/security/access', {
      method: 'GET',
      cache: true,
    });
  }

  /**
   * Update access control
   */
  async updateAccessControl(data: UpdateAccessControlRequest): Promise<ApiResponse<AccessControl>> {
    return apiClient.makeRequest<AccessControl>(`/api/security/access/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Revoke access
   */
  async revokeAccess(accessId: string): Promise<ApiResponse<void>> {
    return apiClient.makeRequest<void>(`/api/security/access/${accessId}/revoke`, {
      method: 'POST',
    });
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(params?: {
    page?: number;
    perPage?: number;
    userId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<{ logs: AuditLog[]; total: number; page: number; perPage: number }>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.perPage) queryParams.set('per_page', params.perPage.toString());
    if (params?.userId) queryParams.set('user_id', params.userId);
    if (params?.action) queryParams.set('action', params.action);
    if (params?.startDate) queryParams.set('start_date', params.startDate);
    if (params?.endDate) queryParams.set('end_date', params.endDate);

    return apiClient.makeRequest<{ logs: AuditLog[]; total: number; page: number; perPage: number }>(
      `/api/security/audit?${queryParams.toString()}`,
      {
        method: 'GET',
        cache: false,
      }
    );
  }

  /**
   * Get audit log details
   */
  async getAuditLog(logId: string): Promise<ApiResponse<AuditLog>> {
    return apiClient.makeRequest<AuditLog>(`/api/security/audit/${logId}`, {
      method: 'GET',
      cache: true,
    });
  }

  /**
   * Get compliance reports
   */
  async getComplianceReports(): Promise<ApiResponse<ComplianceReport[]>> {
    return apiClient.makeRequest<ComplianceReport[]>('/api/security/compliance', {
      method: 'GET',
      cache: true,
    });
  }

  /**
   * Get compliance report details
   */
  async getComplianceReport(reportId: string): Promise<ApiResponse<ComplianceReport>> {
    return apiClient.makeRequest<ComplianceReport>(`/api/security/compliance/${reportId}`, {
      method: 'GET',
      cache: true,
    });
  }

  /**
   * Run security scan
   */
  async runSecurityScan(data: SecurityScanRequest): Promise<ApiResponse<SecurityScanResponse>> {
    return apiClient.makeRequest<SecurityScanResponse>('/api/security/scan', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get security scan status
   */
  async getSecurityScanStatus(scanId: string): Promise<ApiResponse<SecurityScanResponse>> {
    return apiClient.makeRequest<SecurityScanResponse>(`/api/security/scan/${scanId}`, {
      method: 'GET',
      cache: false,
    });
  }
}

export const securityApiService = new SecurityApiService();

