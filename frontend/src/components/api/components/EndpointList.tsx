// Endpoint List Component
// Extracted from APIDevelopment.tsx

import React from 'react';
import { Server, Eye, Copy } from 'lucide-react';
import { getMethodColor, getStatusColor } from '../utils/helpers';
import type { APIEndpoint } from '../types';

interface EndpointListProps {
  endpoints: APIEndpoint[];
  onViewDetails: (endpoint: APIEndpoint) => void;
}

export const EndpointList: React.FC<EndpointListProps> = ({ endpoints, onViewDetails }) => {
  return (
    <div className="p-6">
      <div className="space-y-4">
        {endpoints.map((endpoint) => (
          <div
            key={endpoint.id}
            className="border border-secondary-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Server className="w-4 h-4 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-secondary-900">{endpoint.name}</h3>
                  <p className="text-sm text-secondary-600">{endpoint.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getMethodColor(endpoint.method)}`}
                >
                  {endpoint.method}
                </span>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(endpoint.status)}`}
                >
                  {endpoint.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-3">
              <div>
                <span className="text-secondary-600">Path:</span>
                <span className="ml-2 font-mono text-secondary-900">{endpoint.path}</span>
              </div>
              <div>
                <span className="text-secondary-600">Version:</span>
                <span className="ml-2 text-secondary-900">{endpoint.version}</span>
              </div>
              <div>
                <span className="text-secondary-600">Requests:</span>
                <span className="ml-2 text-secondary-900">
                  {endpoint.usage.totalRequests.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-secondary-600">Success Rate:</span>
                <span className="ml-2 text-secondary-900">
                  {endpoint.usage.successRate.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => onViewDetails(endpoint)}
                className="btn-secondary text-sm flex-1"
              >
                <Eye className="w-4 h-4 mr-1" />
                View Details
              </button>
              <button className="btn-primary text-sm flex-1">
                <Copy className="w-4 h-4 mr-1" />
                Copy URL
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

