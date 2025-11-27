/**
 * Utility functions for security feature
 */

import * as React from 'react';
import { User, Shield, Activity, CheckCircle, Lock } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Get status color class based on status value
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
    case 'compliant':
    case 'success':
      return 'bg-green-100 text-green-800';
    case 'inactive':
    case 'non_compliant':
    case 'failure':
    case 'blocked':
      return 'bg-red-100 text-red-800';
    case 'partial':
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'draft':
    case 'pending':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get severity color class based on severity value
 */
export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-800';
    case 'high':
      return 'bg-orange-100 text-orange-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get category icon based on category value
 */
export function getCategoryIcon(category: string): ReactNode {
  switch (category) {
    case 'access_control':
      return <User className="w-4 h-4" />;
    case 'data_protection':
      return <Shield className="w-4 h-4" />;
    case 'audit':
      return <Activity className="w-4 h-4" />;
    case 'compliance':
      return <CheckCircle className="w-4 h-4" />;
    case 'encryption':
      return <Lock className="w-4 h-4" />;
    default:
      return <Shield className="w-4 h-4" />;
  }
}

/**
 * Get framework color class based on framework value
 */
export function getFrameworkColor(framework: string): string {
  switch (framework) {
    case 'gdpr':
      return 'bg-blue-100 text-blue-800';
    case 'sox':
      return 'bg-green-100 text-green-800';
    case 'pci':
      return 'bg-purple-100 text-purple-800';
    case 'hipaa':
      return 'bg-orange-100 text-orange-800';
    case 'iso27001':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

