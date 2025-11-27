/**
 * Security Formatting Utilities
 */

export const getStatusColor = (status: string): string => {
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
    case 'draft':
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'partial':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getSeverityColor = (severity: string): string => {
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
};

export const getFrameworkColor = (framework: string): string => {
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
};

