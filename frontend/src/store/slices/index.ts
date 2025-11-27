// ============================================================================
// REDUX SLICES - CENTRALIZED EXPORTS
// ============================================================================

export { default as authReducer, authActions } from './authSlice';
export { default as projectsReducer, projectsActions } from './projectsSlice';
export { default as dataIngestionReducer, dataSourcesActions } from './dataIngestionSlice';
export {
  default as reconciliationReducer,
  reconciliationRecordsActions,
  reconciliationMatchesActions,
  reconciliationJobsActions,
} from './reconciliationSlice';
export { default as analyticsReducer, analyticsActions } from './analyticsSlice';
export { default as uiReducer, notificationsActions, uiActions } from './uiSlice';

