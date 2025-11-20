// ============================================================================
// SETTINGS API CLIENT
// ============================================================================

import { apiClient } from './index';
import { ApiResponse, UpdateSettingsRequest, SettingsResponse } from './types';

/**
 * Get user settings
 * @returns Promise with user settings
 */
export async function getSettings(): Promise<ApiResponse<SettingsResponse>> {
  return apiClient.get<SettingsResponse>('/api/user/settings');
}

/**
 * Update user settings
 * @param settings Settings to update
 * @returns Promise with updated settings
 */
export async function updateSettings(
  settings: UpdateSettingsRequest
): Promise<ApiResponse<SettingsResponse>> {
  return apiClient.put<SettingsResponse>('/api/user/settings', settings);
}

/**
 * Update user preferences only
 * @param preferences Preferences to update
 * @returns Promise with updated settings
 */
export async function updatePreferences(
  preferences: UpdateSettingsRequest['preferences']
): Promise<ApiResponse<SettingsResponse>> {
  return updateSettings({ preferences });
}

/**
 * Update user notifications only
 * @param notifications Notifications to update
 * @returns Promise with updated settings
 */
export async function updateNotifications(
  notifications: UpdateSettingsRequest['notifications']
): Promise<ApiResponse<SettingsResponse>> {
  return updateSettings({ notifications });
}

/**
 * Update user security settings only
 * @param security Security settings to update
 * @returns Promise with updated settings
 */
export async function updateSecuritySettings(
  security: UpdateSettingsRequest['security']
): Promise<ApiResponse<SettingsResponse>> {
  return updateSettings({ security });
}
