import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Lock,
  FileText,
  Activity,
  Settings,
  Download,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useData } from '@/components/DataProvider';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/services/logger';
import { ApiService } from '@/services/ApiService';
import { usePageOrchestration } from '@/hooks/usePageOrchestration';
import {
  securityPageMetadata,
  getSecurityPageContext,
  getSecurityWorkflowState,
  registerSecurityGuidanceHandlers,
  getSecurityGuidanceContent,
} from '@/orchestration/pages/SecurityPageOrchestration';
import { BasePage, PageConfig, StatsCard, ActionConfig } from '@/components/BasePage';
import type {
  SecurityPolicy,
  ComplianceFramework,
  AuditLog,
  EncryptionConfig,
  SecurityStats
} from '@/types/security';

const SecurityPageContent: React.FC = () => {
  const { currentProject } = useData();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'policies' | 'compliance' | 'audit' | 'encryption'>('overview');
  const [securityPolicies, setSecurityPolicies] = useState<SecurityPolicy[]>([]);
  const [complianceFrameworks, setComplianceFrameworks] = useState<ComplianceFramework[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [encryptionConfigs, setEncryptionConfigs] = useState<EncryptionConfig[]>([]);
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Page Orchestration with Frenly AI
  usePageOrchestration({
    pageMetadata: securityPageMetadata,
    getPageContext: () =>
      getSecurityPageContext(
        currentProject?.id,
        stats?.securityScore || 0,
        stats?.complianceStatus || 0,
        stats?.activePolicies || 0
      ),
    getWorkflowState: () => getSecurityWorkflowState(stats?.securityScore || 0, stats?.complianceStatus || 0),
    registerGuidanceHandlers: () => registerSecurityGuidanceHandlers(),
    getGuidanceContent: (topic) => getSecurityGuidanceContent(topic),
  });

  const fetchData = async () => {
    if (!currentProject) return;
    setIsLoading(true);
    try {
      const [policiesRes, frameworksRes, logsRes, configsRes, statsRes] = await Promise.all([
        ApiService.getSecurityPolicies(currentProject.id),
        ApiService.getComplianceFrameworks(currentProject.id),
        ApiService.getAuditLogs(currentProject.id),
        ApiService.getEncryptionConfigs(currentProject.id),
        ApiService.getSecurityStats(currentProject.id)
      ]);

      if (policiesRes.data) setSecurityPolicies(policiesRes.data);
      if (frameworksRes.data) setComplianceFrameworks(frameworksRes.data);
      if (logsRes.data) setAuditLogs(logsRes.data);
      if (configsRes.data) setEncryptionConfigs(configsRes.data);
      if (statsRes.data) setStats(statsRes.data);

      if (policiesRes.error || frameworksRes.error || logsRes.error || configsRes.error || statsRes.error) {
        logger.warn('Some security data failed to load', {
          policiesError: policiesRes.error,
          frameworksError: frameworksRes.error,
          logsError: logsRes.error,
          configsError: configsRes.error,
          statsError: statsRes.error
        });
        toast.warning('Some security data could not be loaded');
      }
    } catch (err) {
      logger.error('Failed to fetch security data', { error: err });
      toast.error('Failed to load security data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentProject?.id) {
      fetchData();
    }
  }, [currentProject?.id]);

  const config: PageConfig = useMemo(() => ({
    title: 'Security & Compliance',
    description: 'Manage security policies, compliance frameworks, and audit trails',
    icon: Shield,
    path: '/security',
    showStats: true,
    showActions: true,
  }), []);

  const statsCards: StatsCard[] = useMemo(() => [
    {
      title: 'Security Score',
      value: stats?.securityScore ? `${stats.securityScore}%` : 'N/A',
      icon: Shield,
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Compliance Status',
      value: stats?.complianceStatus ? `${stats.complianceStatus}%` : 'N/A',
      icon: FileText,
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      title: 'Active Policies',
      value: stats?.activePolicies ?? 0,
      icon: Settings,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Audit Events (24h)',
      value: stats?.auditEvents24h ?? 0,
      icon: Activity,
      color: 'bg-purple-100 text-purple-600',
    },
  ], [stats]);

  const actions: ActionConfig[] = useMemo(() => [
    {
      label: 'Refresh',
      icon: RefreshCw,
      onClick: fetchData,
      variant: 'secondary',
      loading: isLoading,
    },
    {
      label: 'Export Report',
      icon: Download,
      onClick: () => toast.success('Report export started'),
      variant: 'secondary',
    },
  ], [isLoading]);

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-600 bg-green-100';
      case 'partial': return 'text-yellow-600 bg-yellow-100';
      case 'non-compliant': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <BasePage
      config={config}
      stats={statsCards}
      actions={actions}
      loading={isLoading && !stats}
    >
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'policies', label: 'Security Policies', icon: Shield },
            { id: 'compliance', label: 'Compliance', icon: FileText },
            { id: 'audit', label: 'Audit Logs', icon: Activity },
            { id: 'encryption', label: 'Encryption', icon: Lock },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Recent Security Events */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Security Events</h3>
              <div className="space-y-3">
                {auditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${log.result === 'success' ? 'bg-green-500' :
                        log.result === 'denied' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }`}></div>
                      <div>
                        <p className="font-medium text-gray-900">{log.action}</p>
                        <p className="text-sm text-gray-600">{log.resource} • {log.userId}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{new Date(log.timestamp).toLocaleTimeString()}</p>
                      <p className="text-xs text-gray-500">{log.ipAddress}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Compliance Status */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Status</h3>
              <div className="space-y-4">
                {complianceFrameworks.map((framework) => (
                  <div key={framework.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{framework.name}</h4>
                        <p className="text-sm text-gray-600">{framework.description}</p>
                      </div>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${getComplianceStatusColor(framework.status)}`}>
                        {framework.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Requirements:</span>
                        <span className="ml-2 text-gray-600">{framework.requirements.length}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Last Audit:</span>
                        <span className="ml-2 text-gray-600">{new Date(framework.lastAudit).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Next Audit:</span>
                        <span className="ml-2 text-gray-600">{new Date(framework.nextAudit).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'policies' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Security Policies</h3>
              <Button variant="primary" size="sm">Create Policy</Button>
            </div>
            <div className="space-y-4">
              {securityPolicies.map((policy) => (
                <div key={policy.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{policy.name}</h4>
                      <p className="text-sm text-gray-600">{policy.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${policy.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                        {policy.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {policy.category}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-medium text-gray-700">Rules:</h5>
                    {policy.rules.map((rule) => (
                      <div key={rule.id} className="ml-4 p-2 bg-gray-50 rounded">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{rule.name}</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${rule.type === 'allow' ? 'bg-green-100 text-green-800' :
                            rule.type === 'deny' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                            {rule.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Frameworks</h3>
            <div className="space-y-6">
              {complianceFrameworks.map((framework) => (
                <div key={framework.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{framework.name}</h4>
                      <p className="text-sm text-gray-600">{framework.description}</p>
                    </div>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getComplianceStatusColor(framework.status)}`}>
                      {framework.status}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <h5 className="font-medium text-gray-700">Requirements:</h5>
                    {framework.requirements.map((req) => (
                      <div key={req.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h6 className="font-medium text-gray-900">{req.title}</h6>
                          <p className="text-sm text-gray-600">{req.description}</p>
                          <div className="mt-2">
                            <span className="text-xs text-gray-500">Evidence: </span>
                            {req.evidence.map((evidence, index) => (
                              <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mr-1">
                                {evidence}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${req.status === 'met' ? 'bg-green-100 text-green-800' :
                            req.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                            {req.status}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(req.lastChecked).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Audit Logs</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Timestamp</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">User</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Action</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Resource</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Result</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">{log.userId}</td>
                      <td className="py-3 px-4 text-gray-600">{log.action}</td>
                      <td className="py-3 px-4 text-gray-600">{log.resource}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${log.result === 'success' ? 'bg-green-100 text-green-800' :
                          log.result === 'denied' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                          {log.result}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{log.ipAddress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'encryption' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Encryption Configuration</h3>
              <Button variant="primary" size="sm">Add Encryption</Button>
            </div>
            <div className="space-y-4">
              {encryptionConfigs.map((config) => (
                <div key={config.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{config.name}</h4>
                      <p className="text-sm text-gray-600">{config.algorithm} • {config.keySize} bits</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                        {config.status}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Last Rotated:</span>
                      <span className="ml-2 text-gray-600">{new Date(config.lastRotated).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Next Rotation:</span>
                      <span className="ml-2 text-gray-600">{new Date(config.nextRotation).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </BasePage>
  );
};

export const SecurityPage: React.FC = () => (
  <ErrorBoundary
    fallback={
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-medium text-red-800">Something went wrong</h3>
        <p className="text-red-600 mt-2">
          Unable to load the security page. Please refresh the page.
        </p>
      </div>
    }
  >
    <SecurityPageContent />
  </ErrorBoundary>
);

export default SecurityPage;
