// ============================================================================
// REDUX SLICES - CENTRALIZED EXPORTS
// ============================================================================

export { default as authReducer, setAuthTokens, clearAuth, set2FARequired, setUser2FAStatus, setUser, clearError } from './authSlice';
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

// Re-export auth actions as a named group for backward compatibility
import { setAuthTokens, clearAuth, set2FARequired, setUser2FAStatus, setUser, clearError } from './authSlice';
export const authActions = {
  setAuthTokens,
  clearAuth,
  set2FARequired,
  setUser2FAStatus,
  setUser,
  clearError,
};
