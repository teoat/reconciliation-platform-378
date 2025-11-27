/**
 * Data Source Utilities
 * Handles fetching data from different sources (projects, users)
 */

import { apiClient } from '@/services/apiClient';
import { logger } from '@/services/logger';

/**
 * Fetch project data for reports
 */
export async function fetchProjectData(): Promise<unknown[]> {
  try {
    const response = await apiClient.getProjects();
    if (response.success && response.data) {
      // Transform project data to report format
      return Array.isArray(response.data) ? response.data : [];
    }
    return [];
  } catch (error) {
    logger.error('Error fetching project data', { error });
    return [];
  }
}

/**
 * Fetch user data for reports
 */
export async function fetchUserData(): Promise<unknown[]> {
  try {
    const response = await apiClient.getUsers();
    if (response.success && response.data) {
      // Transform user data to report format
      return Array.isArray(response.data) ? response.data : [];
    }
    return [];
  } catch (error) {
    logger.error('Error fetching user data', { error });
    return [];
  }
}

