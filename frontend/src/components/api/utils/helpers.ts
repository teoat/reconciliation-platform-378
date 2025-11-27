// API Development Helper Functions
// Extracted from APIDevelopment.tsx

/**
 * Get color class for HTTP method
 */
export function getMethodColor(method: string): string {
  switch (method) {
    case 'GET':
      return 'bg-green-100 text-green-800';
    case 'POST':
      return 'bg-blue-100 text-blue-800';
    case 'PUT':
      return 'bg-yellow-100 text-yellow-800';
    case 'DELETE':
      return 'bg-red-100 text-red-800';
    case 'PATCH':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get color class for status
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'deprecated':
      return 'bg-yellow-100 text-yellow-800';
    case 'beta':
      return 'bg-blue-100 text-blue-800';
    case 'error':
      return 'bg-red-100 text-red-800';
    case 'inactive':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get color class for HTTP status code
 */
export function getStatusCodeColor(statusCode: number): string {
  if (statusCode >= 200 && statusCode < 300) return 'bg-green-100 text-green-800';
  if (statusCode >= 300 && statusCode < 400) return 'bg-blue-100 text-blue-800';
  if (statusCode >= 400 && statusCode < 500) return 'bg-yellow-100 text-yellow-800';
  if (statusCode >= 500) return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-800';
}

