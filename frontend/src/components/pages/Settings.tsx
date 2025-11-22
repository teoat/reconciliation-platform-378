import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateSettings, getSettings } from '../../services/apiClient/settings';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { useToast } from '../../hooks/useToast';
import { logger } from '../../services/logger';
import { SkipLink, ARIALiveRegion } from '../ui/Accessibility';
import { OnboardingAnalyticsDashboard } from '../onboarding/OnboardingAnalyticsDashboard';
import { FeatureGate } from '../ui/FeatureGate';
import { ArrowLeft, Save, Bell, Shield, Palette, CheckCircle } from 'lucide-react';
import { PageMeta } from '../seo/PageMeta';

interface SettingsData {
  notifications: {
    email: boolean;
    push: boolean;
    reconciliationComplete: boolean;
  };
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
  };
}

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser, user } = useAuth();
  const toast = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'notifications' | 'preferences' | 'security' | 'analytics'
  >('preferences');
  const [liveMessage, setLiveMessage] = useState('');
  const [settings, setSettings] = useState<SettingsData>({
    notifications: {
      email: true,
      push: false,
      reconciliationComplete: true,
    },
    preferences: {
      theme: 'light',
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    security: {
      twoFactorEnabled: false,
      sessionTimeout: 3600,
    },
  });

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      logger.logUserAction('save_settings', 'Settings', { activeTab });

      // Transform frontend settings format to API format
      const apiSettings = {
        notifications: {
          email: settings.notifications.email,
          push: settings.notifications.push,
          reconciliation_complete: settings.notifications.reconciliationComplete,
        },
        preferences: {
          theme: settings.preferences.theme,
          language: settings.preferences.language,
          timezone: settings.preferences.timezone,
        },
        security: {
          two_factor_enabled: settings.security.twoFactorEnabled,
          session_timeout: settings.security.sessionTimeout,
        },
      };

      const response = await updateSettings(apiSettings);

      if (response.success && response.data) {
        // Update local state with response data
        setSettings({
          notifications: {
            email: response.data.notifications.email,
            push: response.data.notifications.push,
            reconciliationComplete: response.data.notifications.reconciliation_complete,
          },
          preferences: {
            theme: response.data.preferences.theme,
            language: response.data.preferences.language,
            timezone: response.data.preferences.timezone,
          },
          security: {
            twoFactorEnabled: response.data.security.two_factor_enabled,
            sessionTimeout: response.data.security.session_timeout,
          },
        });

        toast.success('Settings saved successfully');
        logger.info('Settings updated successfully', { settings: apiSettings });
        setLiveMessage('Settings saved successfully');

        // Refresh user to get updated preferences
        await refreshUser();
      } else {
        throw new Error(response.message || 'Failed to save settings');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save settings';
      logger.error('Failed to save settings', { error: errorMessage, settings });
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [settings, toast, refreshUser, activeTab]);

  // Memoize tab change handlers
  const handleTabChange = useCallback(
    (tab: 'notifications' | 'preferences' | 'security' | 'analytics') => {
      setActiveTab(tab);
    },
    []
  );

  // Memoize settings update handlers
  const updatePreferences = useCallback(
    <K extends keyof SettingsData['preferences']>(
      key: K,
      value: SettingsData['preferences'][K]
    ) => {
      setSettings((prev) => ({
        ...prev,
        preferences: { ...prev.preferences, [key]: value },
      }));
    },
    []
  );

  const updateNotifications = useCallback(
    <K extends keyof SettingsData['notifications']>(
      key: K,
      value: SettingsData['notifications'][K]
    ) => {
      setSettings((prev) => ({
        ...prev,
        notifications: { ...prev.notifications, [key]: value },
      }));
    },
    []
  );

  const updateSecurity = useCallback(
    <K extends keyof SettingsData['security']>(key: K, value: SettingsData['security'][K]) => {
      setSettings((prev) => ({
        ...prev,
        security: { ...prev.security, [key]: value },
      }));
    },
    []
  );

  // Memoize tab classes
  const tabClasses = useMemo(
    () => ({
      active: 'border-blue-500 text-blue-600',
      inactive: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
    }),
    []
  );

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const response = await getSettings();
        if (response.success && response.data) {
          setSettings({
            notifications: {
              email: response.data.notifications.email,
              push: response.data.notifications.push,
              reconciliationComplete: response.data.notifications.reconciliation_complete,
            },
            preferences: {
              theme: response.data.preferences.theme,
              language: response.data.preferences.language,
              timezone: response.data.preferences.timezone,
            },
            security: {
              twoFactorEnabled: response.data.security.two_factor_enabled,
              sessionTimeout: response.data.security.session_timeout,
            },
          });
          logger.info('Settings loaded successfully');
        } else {
          logger.warning('Failed to load settings, using defaults', { response });
        }
      } catch (error) {
        logger.error('Error loading settings', { error });
        // Use default settings on error
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
            aria-label="Loading settings"
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Settings"
        description="Configure application settings, preferences, and account options."
        keywords="settings, preferences, configuration, account"
      />
      <main id="main-content" className="max-w-4xl mx-auto p-6">
        <SkipLink />
        <ARIALiveRegion message={liveMessage} priority="polite" />
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            aria-label="Back to dashboard"
            type="button"
          >
            <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
        </div>

<<<<<<< HEAD
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px" aria-label="Tabs">
=======
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px" aria-label="Tabs" role="tablist">
            <button
              onClick={() => handleTabChange('preferences')}
              className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'preferences'
                  ? tabClasses.active
                  : tabClasses.inactive
              }`}
              aria-label="Preferences"
              role="tab"
              aria-selected={activeTab === 'preferences' ? 'true' : 'false'}
              type="button"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleTabChange('preferences')
                }
              }}
            >
              <div className="flex items-center justify-center space-x-2">
                <Palette className="w-4 h-4" aria-hidden="true" />
                <span>Preferences</span>
              </div>
            </button>
            <button
              onClick={() => handleTabChange('notifications')}
              className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'notifications'
                  ? tabClasses.active
                  : tabClasses.inactive
              }`}
              aria-label="Notifications"
              role="tab"
              aria-selected={activeTab === 'notifications' ? 'true' : 'false'}
              type="button"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleTabChange('notifications')
                }
              }}
            >
              <div className="flex items-center justify-center space-x-2">
                <Bell className="w-4 h-4" aria-hidden="true" />
                <span>Notifications</span>
              </div>
            </button>
            <button
              onClick={() => handleTabChange('security')}
              className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'security'
                  ? tabClasses.active
                  : tabClasses.inactive
              }`}
              aria-label="Security"
              role="tab"
              aria-selected={activeTab === 'security' ? 'true' : 'false'}
              type="button"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleTabChange('security')
                }
              }}
            >
              <div className="flex items-center justify-center space-x-2">
                <Shield className="w-4 h-4" aria-hidden="true" />
                <span>Security</span>
              </div>
            </button>
            <FeatureGate
              featureId="onboarding-analytics"
              requiredRole={['admin']}
              userRole={((user as { role?: string })?.role || 'user') as 'admin' | 'analyst' | 'viewer'}
              showUnavailable={false}
            >
>>>>>>> 26355dbeb6c502c5e28667489dcec2dc481751c1
              <button
                onClick={() => handleTabChange('preferences')}
                className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'preferences' ? tabClasses.active : tabClasses.inactive
                }`}
                aria-label="Preferences"
                role="tab"
                aria-selected={activeTab === 'preferences' ? 'true' : 'false'}
                type="button"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleTabChange('preferences');
                  }
                }}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Palette className="w-4 h-4" aria-hidden="true" />
                  <span>Preferences</span>
                </div>
              </button>
              <button
                onClick={() => handleTabChange('notifications')}
                className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'notifications' ? tabClasses.active : tabClasses.inactive
                }`}
                aria-label="Notifications"
                role="tab"
                aria-selected={activeTab === 'notifications' ? 'true' : 'false'}
                type="button"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleTabChange('notifications');
                  }
                }}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Bell className="w-4 h-4" aria-hidden="true" />
                  <span>Notifications</span>
                </div>
              </button>
              <button
                onClick={() => handleTabChange('security')}
                className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'security' ? tabClasses.active : tabClasses.inactive
                }`}
                aria-label="Security"
                role="tab"
                aria-selected={activeTab === 'security' ? 'true' : 'false'}
                type="button"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleTabChange('security');
                  }
                }}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Shield className="w-4 h-4" aria-hidden="true" />
                  <span>Security</span>
                </div>
              </button>
              <FeatureGate
                featureId="onboarding-analytics"
                requiredRole={['admin']}
                userRole={(user as { role?: string })?.role || 'user'}
                showUnavailable={false}
              >
                <button
                  onClick={() => handleTabChange('analytics')}
                  className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'analytics' ? tabClasses.active : tabClasses.inactive
                  }`}
                  aria-label="Onboarding Analytics"
                  role="tab"
                  aria-selected={activeTab === 'analytics' ? 'true' : 'false'}
                  type="button"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleTabChange('analytics');
                    }
                  }}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle className="w-4 h-4" aria-hidden="true" />
                    <span>Analytics</span>
                  </div>
                </button>
              </FeatureGate>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-2">
                    Theme
                  </label>
                  <select
                    id="theme"
                    value={settings.preferences.theme}
                    onChange={(e) =>
                      updatePreferences('theme', e.target.value as 'light' | 'dark' | 'auto')
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    aria-label="Theme selection"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto (System)</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="language"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Language
                  </label>
                  <select
                    id="language"
                    value={settings.preferences.language}
                    onChange={(e) => updatePreferences('language', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    aria-label="Language selection"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="timezone"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Timezone
                  </label>
                  <select
                    id="timezone"
                    value={settings.preferences.timezone}
                    onChange={(e) => updatePreferences('timezone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    aria-label="Timezone selection"
                  >
                    <option value={Intl.DateTimeFormat().resolvedOptions().timeZone}>
                      {Intl.DateTimeFormat().resolvedOptions().timeZone}
                    </option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="America/Los_Angeles">America/Los_Angeles</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="Asia/Tokyo">Asia/Tokyo</option>
                  </select>
                </div>
              </div>
<<<<<<< HEAD
=======
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="two-factor" className="block text-sm font-medium text-gray-700">
                    Two-Factor Authentication
                  </label>
                  <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                </div>
                <input
                  type="checkbox"
                  id="two-factor"
                  checked={settings.security.twoFactorEnabled}
                  onChange={(e) => updateSecurity('twoFactorEnabled', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  aria-label="Two-factor authentication"
                />
              </div>

              <div>
                <label htmlFor="session-timeout" className="block text-sm font-medium text-gray-700 mb-2">
                  Session Timeout (minutes)
                </label>
                <input
                  type="number"
                  id="session-timeout"
                  min="15"
                  max="1440"
                  value={settings.security.sessionTimeout / 60}
                  onChange={(e) => updateSecurity('sessionTimeout', parseInt(e.target.value) * 60)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label="Session timeout in minutes"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Session will expire after {settings.security.sessionTimeout / 60} minutes of inactivity
                </p>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <FeatureGate
              featureId="onboarding-analytics-dashboard"
              requiredRole={['admin']}
              userRole={((user as { role?: string })?.role || 'user') as 'admin' | 'analyst' | 'viewer'}
              fallback={
                <div className="text-center py-8 text-gray-500">
                  <p>Analytics dashboard is only available to administrators.</p>
                </div>
              }
            >
              <OnboardingAnalyticsDashboard showRealTime={true} />
            </FeatureGate>
          )}
        </div>

        {/* Save Button */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end space-x-4">
          <Button variant="outline" onClick={() => navigate('/')} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" aria-hidden="true"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
>>>>>>> 26355dbeb6c502c5e28667489dcec2dc481751c1
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label
                      htmlFor="email-notifications"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Email Notifications
                    </label>
                    <p className="text-sm text-gray-500">
                      Receive email notifications for important events
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    id="email-notifications"
                    checked={settings.notifications.email}
                    onChange={(e) => updateNotifications('email', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    aria-label="Email notifications"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label
                      htmlFor="push-notifications"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Push Notifications
                    </label>
                    <p className="text-sm text-gray-500">Receive browser push notifications</p>
                  </div>
                  <input
                    type="checkbox"
                    id="push-notifications"
                    checked={settings.notifications.push}
                    onChange={(e) => updateNotifications('push', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    aria-label="Push notifications"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label
                      htmlFor="reconciliation-complete"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Reconciliation Complete
                    </label>
                    <p className="text-sm text-gray-500">
                      Notify when reconciliation jobs complete
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    id="reconciliation-complete"
                    checked={settings.notifications.reconciliationComplete}
                    onChange={(e) =>
                      updateNotifications('reconciliationComplete', e.target.checked)
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    aria-label="Reconciliation complete notifications"
                  />
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="two-factor" className="block text-sm font-medium text-gray-700">
                      Two-Factor Authentication
                    </label>
                    <p className="text-sm text-gray-500">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    id="two-factor"
                    checked={settings.security.twoFactorEnabled}
                    onChange={(e) => updateSecurity('twoFactorEnabled', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    aria-label="Two-factor authentication"
                  />
                </div>

                <div>
                  <label
                    htmlFor="session-timeout"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    id="session-timeout"
                    min="15"
                    max="1440"
                    value={settings.security.sessionTimeout / 60}
                    onChange={(e) =>
                      updateSecurity('sessionTimeout', parseInt(e.target.value) * 60)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    aria-label="Session timeout in minutes"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Session will expire after {settings.security.sessionTimeout / 60} minutes of
                    inactivity
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <FeatureGate
                featureId="onboarding-analytics-dashboard"
                requiredRole={['admin']}
                userRole={(user as { role?: string })?.role || 'user'}
                fallback={
                  <div className="text-center py-8 text-gray-500">
                    <p>Analytics dashboard is only available to administrators.</p>
                  </div>
                }
              >
                <OnboardingAnalyticsDashboard showRealTime={true} />
              </FeatureGate>
            )}
          </div>

          {/* Save Button */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end space-x-4">
            <Button variant="outline" onClick={() => navigate('/')} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <div
                    className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
                    aria-hidden="true"
                  ></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </>
  );
};

export default Settings;
