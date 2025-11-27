// ============================================================================
// PROJECTS API HOOK (Enhanced with Redux)
// ============================================================================

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/unifiedStore';
import { projectsActions, deleteProject as deleteProjectThunk } from '../../store/unifiedStore';
import ApiService from '../../services/ApiService';
import { useNotificationHelpers } from '../../store/hooks';

export const useProjectsAPI = () => {
  const dispatch = useAppDispatch();
  const {
    projects,
    isLoading,
    error,
  } = useAppSelector((state) => state.projects);
  const { showSuccess, showError } = useNotificationHelpers();

  const fetchProjects = useCallback(
    async (
      params: {
        page?: number;
        per_page?: number;
        search?: string;
        status?: string;
      } = {}
    ) => {
      try {
        dispatch(projectsActions.fetchProjectsStart());
        const result = await ApiService.getProjects(params);

        dispatch(
          projectsActions.fetchProjectsSuccess({
            projects: result.projects,
            pagination: result.pagination,
          })
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch projects';
        dispatch(projectsActions.fetchProjectsFailure(errorMessage));
        showError('Failed to Load Projects', errorMessage);
      }
    },
    [dispatch, showError]
  );

  const createProject = useCallback(
    async (projectData: {
      name: string;
      description?: string;
      settings?: Record<string, unknown>;
      status?: string;
    }) => {
      try {
        const newProject = await ApiService.createProject(projectData);
        if (newProject?.name) {
          showSuccess('Project Created', `Project "${newProject.name}" created successfully`);
        } else {
          showSuccess('Project Created', 'Project created successfully');
        }

        return { success: true, project: newProject };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create project';
        showError('Failed to Create Project', errorMessage);

        return { success: false, error: errorMessage };
      }
    },
    [dispatch, showSuccess, showError]
  );

  const updateProject = useCallback(
    async (
      projectId: string,
      projectData: {
        name?: string;
        description?: string;
        settings?: Record<string, unknown>;
        status?: string;
        is_active?: boolean;
      }
    ) => {
      try {
        const updatedProject = await ApiService.updateProject(projectId, projectData);
        if (updatedProject?.name) {
          showSuccess('Project Updated', `Project "${updatedProject.name}" updated successfully`);
        } else {
          showSuccess('Project Updated', 'Project updated successfully');
        }

        return { success: true, project: updatedProject };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update project';
        showError('Failed to Update Project', errorMessage);

        return { success: false, error: errorMessage };
      }
    },
    [dispatch, showSuccess, showError]
  );

  const deleteProject = useCallback(
    async (projectId: string) => {
      try {
        const result = await dispatch(deleteProjectThunk(projectId));
        if (deleteProjectThunk.fulfilled.match(result)) {
          showSuccess('Project Deleted', 'Project deleted successfully');
          return { success: true };
        } else {
          throw new Error(result.payload as string || 'Failed to delete project');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete project';
        showError('Failed to Delete Project', errorMessage);

        return { success: false, error: errorMessage };
      }
    },
    [dispatch, showSuccess, showError]
  );

  return {
    projects,
    isLoading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  };
};

