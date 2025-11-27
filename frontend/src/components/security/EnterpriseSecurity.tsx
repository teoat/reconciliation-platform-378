'use client';

import { Shield, User, Activity, CheckCircle, Plus as PlusIcon } from 'lucide-react';
import { useData } from '../components/DataProvider';
import type { EnterpriseSecurityProps, SecurityTabId } from './types';
import { useEnterpriseSecurity } from './hooks/useEnterpriseSecurity';
import {
  SecurityOverview,
  PoliciesTab,
  AccessTab,
  AuditTab,
  ComplianceTab,
} from './components';

const EnterpriseSecurity = ({ project, onProgressUpdate }: EnterpriseSecurityProps) => {
  const { currentProject } = useData();
  const {
    securityPolicies,
    accessControls,
    auditLogs,
    complianceReports,
    activeTab,
    isCreating,
    setActiveTab,
    handleCreatePolicy,
  } = useEnterpriseSecurity(onProgressUpdate);

  const tabs = [
    { id: 'policies' as SecurityTabId, label: 'Security Policies', icon: Shield },
    { id: 'access' as SecurityTabId, label: 'Access Control', icon: User },
    { id: 'audit' as SecurityTabId, label: 'Audit Logs', icon: Activity },
    { id: 'compliance' as SecurityTabId, label: 'Compliance', icon: CheckCircle },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              Enterprise Security & Compliance
            </h1>
            <p className="text-secondary-600">
              Security policies, access controls, audit logs, and compliance management
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCreatePolicy}
              disabled={isCreating}
              className="btn-secondary flex items-center space-x-2 disabled:opacity-50"
            >
              <PlusIcon className="w-4 h-4" />
              <span>New Policy</span>
            </button>
            <button className="btn-primary flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Security Scan</span>
            </button>
          </div>
        </div>

        {project && (
          <div className="text-sm text-primary-600 bg-primary-50 px-3 py-2 rounded-lg inline-block">
            Project: {project.name}
          </div>
        )}
      </div>

      {/* Security Overview */}
      <SecurityOverview
        policies={securityPolicies}
        accessControls={accessControls}
        auditLogs={auditLogs}
        complianceReports={complianceReports}
      />

      {/* Tabs */}
      <div className="card mb-6">
        <div className="border-b border-secondary-200">
          <div className="flex space-x-8" role="tablist" aria-label="Security tabs">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                  }`}
                  role="tab"
                  aria-selected={activeTab === tab.id ? 'true' : 'false'}
                  aria-label={tab.label}
                  type="button"
                >
                  <TabIcon className="w-4 h-4" aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'policies' && <PoliciesTab policies={securityPolicies} />}

        {activeTab === 'access' && <AccessTab accessControls={accessControls} />}

        {activeTab === 'audit' && <AuditTab auditLogs={auditLogs} />}

        {activeTab === 'compliance' && <ComplianceTab reports={complianceReports} />}
      </div>
    </div>
  );
};

export default EnterpriseSecurity;
