// ============================================================================
// PROJECTS SLICE
// ============================================================================

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  fetchProjects,
  createProject,
  updateProject,
  deleteProject,
} from '../asyncThunkUtils';
import type { ProjectsState } from '../types';
import type { Project as BackendProject } from '../../types/backend-aligned';

const initialProjectsState: ProjectsState = {
  projects: [],
  selectedProject: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  searchQuery: '',
  filterStatus: null,
};

export const projectsSlice = createSlice({
  name: 'projects',
  initialState: initialProjectsState,
  reducers: {
    setSelectedProject: (state, action: PayloadAction<BackendProject | null>) => {
      state.selectedProject = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setFilterStatus: (state, action: PayloadAction<string | null>) => {
      state.filterStatus = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    // Compatibility actions for useApiEnhanced.ts
    fetchProjectsStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchProjectsSuccess: (
      state,
      action: PayloadAction<{ projects: BackendProject[]; pagination: ProjectsState['pagination'] }>
    ) => {
      state.projects = action.payload.projects;
      state.pagination = action.payload.pagination;
      state.isLoading = false;
      state.error = null;
    },
    fetchProjectsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch Projects
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.isLoading = false;
        const payload = action.payload as {
          data?: BackendProject[];
          projects?: BackendProject[];
          metadata?: { pagination?: ProjectsState['pagination'] };
          pagination?: ProjectsState['pagination'];
        };
        state.projects = payload.data || payload.projects || [];
        state.pagination = payload.metadata?.pagination || payload.pagination || state.pagination;
        state.error = null;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create Project
      .addCase(createProject.fulfilled, (state, action) => {
        state.projects.unshift(action.payload as BackendProject);
        state.pagination.total += 1;
      })
      // Update Project
      .addCase(updateProject.fulfilled, (state, action) => {
        const project = action.payload as BackendProject;
        const index = state.projects.findIndex((p) => p.id === project.id);
        if (index !== -1) {
          state.projects[index] = project;
        }
        if (state.selectedProject?.id === project.id) {
          state.selectedProject = project;
        }
      })
      // Delete Project
      .addCase(deleteProject.fulfilled, (state, action) => {
        const projectId = action.payload as string;
        state.projects = state.projects.filter((p) => p.id !== projectId);
        if (state.selectedProject?.id === projectId) {
          state.selectedProject = null;
        }
        state.pagination.total -= 1;
      });
  },
});

export const projectsActions = projectsSlice.actions;
export default projectsSlice.reducer;

