/**
 * Validation utilities for security
 */

import type { SecurityPolicy, AccessControl } from '../types';

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate security policy
 */
export function validatePolicy(policy: Partial<SecurityPolicy>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!policy.name || policy.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Policy name is required' });
  }

  if (!policy.description || policy.description.trim().length === 0) {
    errors.push({ field: 'description', message: 'Description is required' });
  }

  if (!policy.category) {
    errors.push({ field: 'category', message: 'Category is required' });
  }

  if (!policy.priority) {
    errors.push({ field: 'priority', message: 'Priority is required' });
  }

  return errors;
}

/**
 * Validate access control
 */
export function validateAccessControl(access: Partial<AccessControl>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!access.userId || access.userId.trim().length === 0) {
    errors.push({ field: 'userId', message: 'User ID is required' });
  }

  if (!access.role || access.role.trim().length === 0) {
    errors.push({ field: 'role', message: 'Role is required' });
  }

  if (!access.permissions || access.permissions.length === 0) {
    errors.push({ field: 'permissions', message: 'At least one permission is required' });
  }

  if (!access.resources || access.resources.length === 0) {
    errors.push({ field: 'resources', message: 'At least one resource is required' });
  }

  return errors;
}

