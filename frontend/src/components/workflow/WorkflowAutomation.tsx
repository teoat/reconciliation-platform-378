'use client';

import { Plus, Settings } from 'lucide-react';
import { Workflow, Activity, CheckCircle } from 'lucide-react';
import { useData } from '../DataProvider';
import type { WorkflowAutomationProps, TabId } from './types';
import { useWorkflowAutomation } from './hooks/useWorkflowAutomation';
import {
  WorkflowsTab,
  InstancesTab,
  RulesTab,
  ApprovalsTab,
  WorkflowDetailModal,
} from './components';

const WorkflowAutomation = ({ project, onProgressUpdate }: WorkflowAutomationProps) => {
  const { currentProject } = useData();
  const {
    workflows,
    workflowInstances,
    businessRules,
    approvalRequests,
    selectedWorkflow,
    showWorkflowModal,
    activeTab,
    isCreating,
    setSelectedWorkflow,
    setShowWorkflowModal,
    setActiveTab,
    handleCreateWorkflow,
    handleCreateRule,
    handleApproveRequest,
    handleRejectRequest,
  } = useWorkflowAutomation(onProgressUpdate);

  const tabs = [
    { id: 'workflows' as TabId, label: 'Workflows', icon: Workflow },
    { id: 'instances' as TabId, label: 'Instances', icon: Activity },
    { id: 'rules' as TabId, label: 'Business Rules', icon: Settings },
    { id: 'approvals' as TabId, label: 'Approvals', icon: CheckCircle },
  ];

  return (
    <div>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-secondary-900 mb-2">Workflow Automation</h1>
              <p className="text-secondary-600">
                Automated workflows, business rules, and approval processes
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCreateWorkflow}
                disabled={isCreating}
                className="btn-secondary flex items-center space-x-2 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>New Workflow</span>
              </button>
              <button
                onClick={handleCreateRule}
                disabled={isCreating}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50"
              >
                <Settings className="w-4 h-4" />
                <span>New Rule</span>
              </button>
            </div>
          </div>

          {project && (
            <div className="text-sm text-primary-600 bg-primary-50 px-3 py-2 rounded-lg inline-block">
              Project: {project.name}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="card mb-6">
          <div className="border-b border-secondary-200">
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'workflows' && (
            <WorkflowsTab workflows={workflows} onViewWorkflow={setSelectedWorkflow} />
          )}

          {activeTab === 'instances' && (
            <InstancesTab instances={workflowInstances} workflows={workflows} />
          )}

          {activeTab === 'rules' && <RulesTab rules={businessRules} />}

          {activeTab === 'approvals' && (
            <ApprovalsTab
              approvals={approvalRequests}
              onApprove={handleApproveRequest}
              onReject={handleRejectRequest}
            />
          )}
        </div>

        {/* Workflow Detail Modal */}
        {showWorkflowModal && selectedWorkflow && (
          <WorkflowDetailModal
            workflow={selectedWorkflow}
            onClose={() => setShowWorkflowModal(false)}
          />
        )}
      </div>
    </div>
  );
};

export default WorkflowAutomation;
