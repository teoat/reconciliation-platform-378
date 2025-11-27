'use client';

import { useState } from 'react';
import { Zap, Plus } from 'lucide-react';
import { useData } from '../DataProvider';
import { ProgressiveFeatureDisclosure } from '../ui/ProgressiveFeatureDisclosure';
import { onboardingService } from '../../services/onboardingService';
import { useAPIData } from './hooks/useAPIData';
import { APITabs } from './components/APITabs';
import { EndpointList } from './components/EndpointList';
import type { APIDevelopmentProps, APIEndpoint, APITab } from './types';

const APIDevelopment = ({ project, onProgressUpdate }: APIDevelopmentProps) => {
  const { currentProject: _currentProject } = useData();
  const { endpoints, webhooks, logs, setEndpoints, setWebhooks } = useAPIData({
    project,
    onProgressUpdate,
  });

  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint | null>(null);
  const [_selectedWebhook, setSelectedWebhook] = useState(null);
  const [showEndpointModal, setShowEndpointModal] = useState(false);
  const [_showWebhookModal, setShowWebhookModal] = useState(false);
  const [activeTab, setActiveTab] = useState<APITab>('endpoints');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateEndpoint = () => {
    setIsCreating(true);
    setTimeout(() => {
      const newEndpoint: APIEndpoint = {
        id: `endpoint-${Date.now()}`,
        name: 'New API Endpoint',
        path: '/api/v1/new-endpoint',
        method: 'GET',
        description: 'New endpoint description',
        parameters: [],
        responses: [],
        authentication: 'bearer',
        rateLimit: { requests: 100, period: 'hour' },
        status: 'beta',
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        usage: {
          totalRequests: 0,
          successRate: 0,
          averageResponseTime: 0,
        },
      };
      setEndpoints((prev) => [...prev, newEndpoint]);
      setIsCreating(false);
    }, 1000);
  };

  const handleCreateWebhook = () => {
    setIsCreating(true);
    setTimeout(() => {
      const newWebhook = {
        id: `webhook-${Date.now()}`,
        name: 'New Webhook',
        url: 'https://example.com/webhook',
        events: [],
        secret: 'whsec_' + Math.random().toString(36).substring(2, 15),
        status: 'inactive' as const,
        successRate: 0,
        retryPolicy: {
          maxRetries: 3,
          backoffStrategy: 'exponential' as const,
        },
        headers: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setWebhooks((prev) => [...prev, newWebhook]);
      setIsCreating(false);
    }, 1000);
  };

  const userProgress = onboardingService.getProgress('initial').completedSteps;

  return (
    <ProgressiveFeatureDisclosure
      feature={{
        id: 'api-development',
        name: 'API Development Tools',
        description: 'Create and manage API endpoints, webhooks, and integrations',
        unlockRequirements: {
          onboardingSteps: [
            'upload-files',
            'configure-reconciliation',
            'review-matches',
            'visualize-results',
          ],
          minProgress: 60,
        },
        lockedMessage: 'Complete reconciliation workflow to unlock API development tools',
      }}
      userProgress={userProgress}
      showUnlockAnimation={true}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-secondary-900 mb-2">API Development</h1>
              <p className="text-secondary-600">
                RESTful API endpoints, webhooks, and integration tools
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCreateEndpoint}
                disabled={isCreating}
                className="btn-secondary flex items-center space-x-2 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>New Endpoint</span>
              </button>
              <button
                onClick={handleCreateWebhook}
                disabled={isCreating}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                <span>New Webhook</span>
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
          <APITabs activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Endpoints Tab */}
          {activeTab === 'endpoints' && (
            <EndpointList
              endpoints={endpoints}
              onViewDetails={(endpoint) => {
                setSelectedEndpoint(endpoint);
                setShowEndpointModal(true);
              }}
            />
          )}

          {/* Webhooks Tab - Placeholder for now */}
          {activeTab === 'webhooks' && (
            <div className="p-6">
              <div className="text-center py-8 text-secondary-600">
                Webhooks list will be implemented here
              </div>
            </div>
          )}

          {/* Logs Tab - Placeholder for now */}
          {activeTab === 'logs' && (
            <div className="p-6">
              <div className="text-center py-8 text-secondary-600">
                API logs will be implemented here
              </div>
            </div>
          )}

          {/* Documentation Tab - Placeholder for now */}
          {activeTab === 'documentation' && (
            <div className="p-6">
              <div className="text-center py-8 text-secondary-600">
                API documentation will be implemented here
              </div>
            </div>
          )}
        </div>
      </div>
    </ProgressiveFeatureDisclosure>
  );
};

export default APIDevelopment;
