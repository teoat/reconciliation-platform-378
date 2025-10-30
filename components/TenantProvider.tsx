// Multi-Tenant Architecture Implementation
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/apiClient';

// Multi-tenant types
export interface Tenant {
  id: string;
  name: string;
  domain: string;
  subdomain: string;
  settings: TenantSettings;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface TenantSettings {
  theme: {
    primaryColor: string;
    secondaryColor: string;
    logo: string;
    favicon: string;
  };
  features: {
    [key: string]: boolean;
  };
  limits: {
    maxUsers: number;
    maxProjects: number;
    maxStorage: number; // in GB
    maxApiCalls: number; // per month
  };
  branding: {
    companyName: string;
    supportEmail: string;
    customDomain?: string;
  };
}

export interface TenantContextType {
  currentTenant: Tenant | null;
  tenants: Tenant[];
  isLoading: boolean;
  error: string | null;
  switchTenant: (tenantId: string) => Promise<void>;
  updateTenantSettings: (settings: Partial<TenantSettings>) => Promise<void>;
  createTenant: (tenantData: Partial<Tenant>) => Promise<Tenant>;
  deleteTenant: (tenantId: string) => Promise<void>;
  getTenantUsage: (tenantId: string) => Promise<any>;
}

// Multi-tenant context
const TenantContext = createContext<TenantContextType | null>(null);

// Multi-tenant provider
export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detect tenant from subdomain or domain
  const detectTenant = useCallback(async () => {
    try {
      const hostname = window.location.hostname;
      const subdomain = hostname.split('.')[0];
      
      // Skip if it's localhost or main domain
      if (hostname === 'localhost' || hostname === 'yourdomain.com') {
        return null;
      }

      // Try to get tenant by subdomain
      const response = await apiClient.makeRequest<{ tenant: Tenant }>(`/api/tenants/by-subdomain/${subdomain}`);
      if (response.data) {
        return response.data.tenant;
      }

      return null;
    } catch (error) {
      console.error('Error detecting tenant:', error);
      return null;
    }
  }, []);

  // Load current tenant
  const loadCurrentTenant = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First try to detect tenant from domain
      const detectedTenant = await detectTenant();
      if (detectedTenant) {
        setCurrentTenant(detectedTenant);
        setIsLoading(false);
        return;
      }

      // Fallback to stored tenant or default
      const storedTenantId = localStorage.getItem('currentTenantId');
      if (storedTenantId) {
        const response = await apiClient.makeRequest<{ tenant: Tenant }>(`/api/tenants/${storedTenantId}`);
        if (response.data) {
          setCurrentTenant(response.data.tenant);
        }
      }

      // Load user's tenants
      const tenantsResponse = await apiClient.makeRequest<{ tenants: Tenant[] }>('/api/tenants');
      if (tenantsResponse.data) {
        setTenants(tenantsResponse.data.tenants);

        // If no current tenant, use the first one
        if (!currentTenant && tenantsResponse.data.tenants.length > 0) {
          setCurrentTenant(tenantsResponse.data.tenants[0]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tenant');
    } finally {
      setIsLoading(false);
    }
  }, [detectTenant, currentTenant]);

  // Switch tenant
  const switchTenant = useCallback(async (tenantId: string) => {
    try {
      const response = await apiClient.makeRequest<{ tenant: Tenant }>(`/api/tenants/${tenantId}`);
      if (response.data) {
        setCurrentTenant(response.data.tenant);
        localStorage.setItem('currentTenantId', tenantId);

        // Update API client with tenant context
        // apiClient.setTenantContext(tenantId); // TODO: Implement setTenantContext method
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch tenant');
      throw err;
    }
  }, []);

  // Update tenant settings
  const updateTenantSettings = useCallback(async (settings: Partial<TenantSettings>) => {
    if (!currentTenant) return;

    try {
      const response = await apiClient.makeRequest<TenantSettings>(`/api/tenants/${currentTenant.id}/settings`, {
        method: 'PUT',
        body: JSON.stringify(settings),
      });

      if (response.data) {
        setCurrentTenant(prev => prev ? { ...prev, settings: { ...prev.settings, ...settings } } : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tenant settings');
      throw err;
    }
  }, [currentTenant]);

  // Create tenant
  const createTenant = useCallback(async (tenantData: Partial<Tenant>): Promise<Tenant> => {
    try {
      const response = await apiClient.makeRequest<{ tenant: Tenant }>('/api/tenants', {
        method: 'POST',
        body: JSON.stringify(tenantData),
      });

      if (response.data) {
        const newTenant = response.data.tenant;
        setTenants(prev => [...prev, newTenant]);
        return newTenant;
      }
      throw new Error('Failed to create tenant');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tenant');
      throw err;
    }
  }, []);

  // Delete tenant
  const deleteTenant = useCallback(async (tenantId: string) => {
    try {
      await apiClient.makeRequest(`/api/tenants/${tenantId}`, {
        method: 'DELETE',
      });

      setTenants(prev => prev.filter(t => t.id !== tenantId));
      
      if (currentTenant?.id === tenantId) {
        setCurrentTenant(null);
        localStorage.removeItem('currentTenantId');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tenant');
      throw err;
    }
  }, [currentTenant]);

  // Get tenant usage
  const getTenantUsage = useCallback(async (tenantId: string) => {
    try {
      const response = await apiClient.makeRequest(`/api/tenants/${tenantId}/usage`);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get tenant usage');
      throw err;
    }
  }, []);

  // Load tenant on mount
  useEffect(() => {
    loadCurrentTenant();
  }, [loadCurrentTenant]);

  const value: TenantContextType = {
    currentTenant,
    tenants,
    isLoading,
    error,
    switchTenant,
    updateTenantSettings,
    createTenant,
    deleteTenant,
    getTenantUsage,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};

// Hook to use tenant context
export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

// Tenant-aware API client extension
export class TenantAwareApiClient {
  private tenantId: string | null = null;

  constructor(private baseClient: typeof apiClient) {}

  setTenantContext(tenantId: string) {
    this.tenantId = tenantId;
  }

  async makeRequest(endpoint: string, options: RequestInit = {}) {
    const headers = {
      ...options.headers,
      'X-Tenant-ID': this.tenantId || '',
    };

    return this.baseClient.makeRequest(endpoint, {
      ...options,
      headers,
    });
  }
}

// Multi-tenant middleware for backend
export const tenantMiddleware = (req: any, res: any, next: any) => {
  // Extract tenant ID from header, subdomain, or JWT token
  const tenantId = req.headers['x-tenant-id'] || 
                   req.subdomain || 
                   req.user?.tenantId;

  if (tenantId) {
    req.tenantId = tenantId;
  }

  next();
};

// Tenant isolation utilities
export const createTenantIsolation = (tenantId: string) => {
  return {
    // Database queries with tenant isolation
    query: (query: string, params: any[] = []) => {
      return `${query} AND tenant_id = $${params.length + 1}`;
    },

    // File storage with tenant isolation
    getStoragePath: (filename: string) => {
      return `tenants/${tenantId}/${filename}`;
    },

    // Cache keys with tenant isolation
    getCacheKey: (key: string) => {
      return `tenant:${tenantId}:${key}`;
    },

    // Redis keys with tenant isolation
    getRedisKey: (key: string) => {
      return `tenant:${tenantId}:${key}`;
    },
  };
};

// Tenant settings component
export const TenantSettings: React.FC = () => {
  const { currentTenant, updateTenantSettings } = useTenant();
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentTenant) {
      setSettings(currentTenant.settings);
    }
  }, [currentTenant]);

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      await updateTenantSettings(settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentTenant || !settings) {
    return <div>Loading tenant settings...</div>;
  }

  return (
    <div className="tenant-settings">
      <h2>Tenant Settings</h2>
      
      <div className="settings-section">
        <h3>Theme</h3>
        <div className="form-group">
          <label>Primary Color</label>
          <input
            type="color"
            value={settings.theme.primaryColor}
            onChange={(e) => setSettings({
              ...settings,
              theme: { ...settings.theme, primaryColor: e.target.value }
            })}
          />
        </div>
        
        <div className="form-group">
          <label>Secondary Color</label>
          <input
            type="color"
            value={settings.theme.secondaryColor}
            onChange={(e) => setSettings({
              ...settings,
              theme: { ...settings.theme, secondaryColor: e.target.value }
            })}
          />
        </div>
      </div>

      <div className="settings-section">
        <h3>Branding</h3>
        <div className="form-group">
          <label>Company Name</label>
          <input
            type="text"
            value={settings.branding.companyName}
            onChange={(e) => setSettings({
              ...settings,
              branding: { ...settings.branding, companyName: e.target.value }
            })}
          />
        </div>
        
        <div className="form-group">
          <label>Support Email</label>
          <input
            type="email"
            value={settings.branding.supportEmail}
            onChange={(e) => setSettings({
              ...settings,
              branding: { ...settings.branding, supportEmail: e.target.value }
            })}
          />
        </div>
      </div>

      <div className="settings-section">
        <h3>Limits</h3>
        <div className="form-group">
          <label>Max Users</label>
          <input
            type="number"
            value={settings.limits.maxUsers}
            onChange={(e) => setSettings({
              ...settings,
              limits: { ...settings.limits, maxUsers: parseInt(e.target.value) }
            })}
          />
        </div>
        
        <div className="form-group">
          <label>Max Projects</label>
          <input
            type="number"
            value={settings.limits.maxProjects}
            onChange={(e) => setSettings({
              ...settings,
              limits: { ...settings.limits, maxProjects: parseInt(e.target.value) }
            })}
          />
        </div>
      </div>

      <button onClick={handleSave} disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
};

// Tenant switcher component
export const TenantSwitcher: React.FC = () => {
  const { currentTenant, tenants, switchTenant } = useTenant();
  const [isOpen, setIsOpen] = useState(false);

  const handleTenantSwitch = async (tenantId: string) => {
    try {
      await switchTenant(tenantId);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to switch tenant:', error);
    }
  };

  return (
    <div className="tenant-switcher">
      <button onClick={() => setIsOpen(!isOpen)}>
        {currentTenant?.name || 'Select Tenant'}
      </button>
      
      {isOpen && (
        <div className="tenant-dropdown">
          {tenants.map((tenant) => (
            <div
              key={tenant.id}
              className={`tenant-option ${tenant.id === currentTenant?.id ? 'active' : ''}`}
              onClick={() => handleTenantSwitch(tenant.id)}
            >
              {tenant.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TenantProvider;
