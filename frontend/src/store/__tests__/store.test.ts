import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { persistStore } from 'redux-persist';
import { createMockStore, createMockUser, createMockProject } from '../../test/utils';

// Mock secure storage
vi.mock('../../services/secureStorage', () => ({
  SecureStorageService: class {
    get = vi.fn();
    set = vi.fn();
    remove = vi.fn();
    clear = vi.fn();
  },
}));
import {
  authSlice,
  projectsSlice,
  reconciliationSlice,
  ingestionSlice,
  analyticsSlice,
  uiSlice,
  settingsSlice,
} from '../unifiedStore';

describe('Redux Store', () => {
  let store: ReturnType<typeof createMockStore>;
  let persistor: ReturnType<typeof persistStore>;

  beforeEach(() => {
    store = createMockStore();
    persistor = persistStore(store);
  });

  describe('Auth Slice', () => {
    it('should handle login success', () => {
      const user = createMockUser();
      const action = authSlice.actions.loginSuccess({ user, token: 'mock-token' });

      store.dispatch(action);

      const state = store.getState().auth;
      expect(state.user).toEqual(user);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('should handle login failure', () => {
      const action = authSlice.actions.loginFailure('Invalid credentials');

      store.dispatch(action);

      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Invalid credentials');
    });

    it('should handle logout', () => {
      // First login
      const user = createMockUser();
      store.dispatch(authSlice.actions.loginSuccess({ user, token: 'mock-token' }));

      // Then logout
      store.dispatch(authSlice.actions.logout());

      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should handle loading state', () => {
      store.dispatch(authSlice.actions.setLoading(true));

      const state = store.getState().auth;
      expect(state.isLoading).toBe(true);
    });
  });

  describe('Projects Slice', () => {
    it('should handle fetch projects success', () => {
      const projects = [createMockProject(), createMockProject({ id: '2', name: 'Project 2' })];
      const action = projectsSlice.actions.fetchProjectsSuccess(projects);

      store.dispatch(action);

      const state = store.getState().projects;
      expect(state.projects).toEqual(projects);
      expect(state.isLoading).toBe(false);
    });

    it('should handle fetch projects failure', () => {
      const action = projectsSlice.actions.fetchProjectsFailure('Failed to fetch projects');

      store.dispatch(action);

      const state = store.getState().projects;
      expect(state.projects).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Failed to fetch projects');
    });

    it('should handle create project success', () => {
      const project = createMockProject();
      const action = projectsSlice.actions.createProjectSuccess(project);

      store.dispatch(action);

      const state = store.getState().projects;
      expect(state.projects).toContain(project);
    });

    it('should handle update project success', () => {
      const project = createMockProject();
      const updatedProject = { ...project, name: 'Updated Project' };

      // First create a project
      store.dispatch(projectsSlice.actions.createProjectSuccess(project));

      // Then update it
      store.dispatch(projectsSlice.actions.updateProjectSuccess(updatedProject));

      const state = store.getState().projects;
      const updatedProjectInState = state.projects.find((p) => p.id === project.id);
      expect(updatedProjectInState?.name).toBe('Updated Project');
    });

    it('should handle delete project success', () => {
      const project = createMockProject();

      // First create a project
      store.dispatch(projectsSlice.actions.createProjectSuccess(project));

      // Then delete it
      store.dispatch(projectsSlice.actions.deleteProjectSuccess(project.id));

      const state = store.getState().projects;
      expect(state.projects).not.toContain(project);
    });
  });

  describe('Reconciliation Slice', () => {
    it('should handle fetch records success', () => {
      const records = [
        { id: '1', projectId: '1', status: 'matched', confidence: 0.95 },
        { id: '2', projectId: '1', status: 'unmatched', confidence: 0.3 },
      ];
      const action = reconciliationSlice.actions.fetchRecordsSuccess(records);

      store.dispatch(action);

      const state = store.getState().reconciliation;
      expect(state.records).toEqual(records);
      expect(state.isLoading).toBe(false);
    });

    it('should handle update record status', () => {
      const record = { id: '1', projectId: '1', status: 'matched', confidence: 0.95 };

      // First add a record
      store.dispatch(reconciliationSlice.actions.fetchRecordsSuccess([record]));

      // Then update its status
      store.dispatch(
        reconciliationSlice.actions.updateRecordStatus({ id: '1', status: 'reviewed' })
      );

      const state = store.getState().reconciliation;
      const updatedRecord = state.records.find((r) => r.id === '1');
      expect(updatedRecord?.status).toBe('reviewed');
    });
  });

  describe('Ingestion Slice', () => {
    it('should handle fetch jobs success', () => {
      const jobs = [
        { id: '1', projectId: '1', status: 'completed', recordCount: 100 },
        { id: '2', projectId: '1', status: 'running', recordCount: 50 },
      ];
      const action = ingestionSlice.actions.fetchJobsSuccess(jobs);

      store.dispatch(action);

      const state = store.getState().ingestion;
      expect(state.jobs).toEqual(jobs);
      expect(state.isLoading).toBe(false);
    });

    it('should handle create job success', () => {
      const job = { id: '1', projectId: '1', status: 'pending', recordCount: 0 };
      const action = ingestionSlice.actions.createJobSuccess(job);

      store.dispatch(action);

      const state = store.getState().ingestion;
      expect(state.jobs).toContain(job);
    });
  });

  describe('Analytics Slice', () => {
    it('should handle fetch metrics success', () => {
      const metrics = {
        totalProjects: 5,
        totalRecords: 1000,
        matchedRecords: 800,
        unmatchedRecords: 200,
      };
      const action = analyticsSlice.actions.fetchMetricsSuccess(metrics);

      store.dispatch(action);

      const state = store.getState().analytics;
      expect(state.metrics).toEqual(metrics);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('UI Slice', () => {
    it('should handle theme toggle', () => {
      store.dispatch(uiSlice.actions.setTheme('dark'));

      const state = store.getState().ui;
      expect(state.theme).toBe('dark');
    });

    it('should handle sidebar toggle', () => {
      store.dispatch(uiSlice.actions.toggleSidebar());

      const state = store.getState().ui;
      expect(state.sidebarOpen).toBe(false);
    });

    it('should handle notification add', () => {
      const notification = {
        id: '1',
        type: 'success',
        message: 'Operation completed successfully',
        timestamp: Date.now(),
      };
      store.dispatch(uiSlice.actions.addNotification(notification));

      const state = store.getState().ui;
      expect(state.notifications).toContain(notification);
    });

    it('should handle notification remove', () => {
      const notification = {
        id: '1',
        type: 'success',
        message: 'Operation completed successfully',
        timestamp: Date.now(),
      };

      // First add a notification
      store.dispatch(uiSlice.actions.addNotification(notification));

      // Then remove it
      store.dispatch(uiSlice.actions.removeNotification('1'));

      const state = store.getState().ui;
      expect(state.notifications).not.toContain(notification);
    });
  });

  describe('Settings Slice', () => {
    it('should handle update preferences', () => {
      const preferences = {
        theme: 'dark',
        language: 'en',
        notifications: true,
      };
      store.dispatch(settingsSlice.actions.updatePreferences(preferences));

      const state = store.getState().settings;
      expect(state.preferences).toEqual(preferences);
    });

    it('should handle reset settings', () => {
      // First set some preferences
      store.dispatch(settingsSlice.actions.updatePreferences({ theme: 'dark' }));

      // Then reset
      store.dispatch(settingsSlice.actions.resetSettings());

      const state = store.getState().settings;
      expect(state.preferences).toEqual({});
    });
  });
});
