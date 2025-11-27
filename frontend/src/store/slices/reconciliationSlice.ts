// ============================================================================
// RECONCILIATION SLICE
// ============================================================================

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchReconciliationRecords, runMatching } from '../asyncThunkUtils';
import type { ReconciliationState, ReconciliationMatch } from '../types';
import type {
  ReconciliationRecord as BackendReconciliationRecord,
  ReconciliationJob as BackendReconciliationJob,
} from '../../types/backend-aligned';

const initialReconciliationState: ReconciliationState = {
  records: [],
  jobs: [],
  matches: [],
  config: {
    matchingRules: ['amount', 'date', 'description'],
    tolerance: 0.01,
    autoMatch: true,
    priority: 'high',
    batchSize: 100,
    timeout: 30000,
  },
  stats: {
    total: 0,
    matched: 0,
    unmatched: 0,
    discrepancy: 0,
    pending: 0,
    processingTime: 0,
    lastUpdated: new Date().toISOString(),
  },
  isLoading: false,
  error: null,
  matchingProgress: 0,
  matchingResults: null,
};

export const reconciliationSlice = createSlice({
  name: 'reconciliation',
  initialState: initialReconciliationState,
  reducers: {
    setConfig: (state, action: PayloadAction<Partial<ReconciliationState['config']>>) => {
      state.config = { ...state.config, ...action.payload };
    },
    setMatchingProgress: (state, action: PayloadAction<number>) => {
      state.matchingProgress = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    // Job management actions
    setJobs: (state, action: PayloadAction<BackendReconciliationJob[]>) => {
      state.jobs = action.payload;
    },
    addJob: (state, action: PayloadAction<BackendReconciliationJob>) => {
      state.jobs.push(action.payload);
    },
    updateJob: (state, action: PayloadAction<BackendReconciliationJob>) => {
      const index = state.jobs.findIndex((j) => j.id === action.payload.id);
      if (index !== -1) {
        state.jobs[index] = action.payload;
      }
    },
    completeJob: (state, action: PayloadAction<string>) => {
      const job = state.jobs.find((j) => j.id === action.payload);
      if (job) {
        job.status = 'completed';
        job.progress = 100;
        job.completed_at = new Date().toISOString();
      }
    },
    failJob: (state, action: PayloadAction<{ jobId: string; error: string }>) => {
      const job = state.jobs.find((j) => j.id === action.payload.jobId);
      if (job) {
        job.status = 'failed';
        (job as BackendReconciliationJob & { error_message?: string }).error_message =
          action.payload.error;
      }
    },
    // Compatibility actions for useApiEnhanced.ts (reconciliationRecordsActions)
    fetchRecordsStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchRecordsSuccess: (
      state,
      action: PayloadAction<{
        records: BackendReconciliationRecord[];
        pagination?: { page: number; per_page: number; total: number; total_pages: number };
      }>
    ) => {
      state.records = action.payload.records;
      state.isLoading = false;
      state.error = null;
    },
    fetchRecordsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    updateRecord: (state, action: PayloadAction<BackendReconciliationRecord>) => {
      const record = action.payload;
      const index = state.records.findIndex((r: BackendReconciliationRecord) => r.id === record.id);
      if (index !== -1) {
        state.records[index] = record;
      }
    },
    // Compatibility actions for useApiEnhanced.ts (reconciliationMatchesActions)
    fetchMatchesStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchMatchesSuccess: (
      state,
      action: PayloadAction<{
        matches: ReconciliationMatch[];
        pagination?: { page: number; per_page: number; total: number; total_pages: number };
      }>
    ) => {
      if (!state.matches) {
        state.matches = [];
      }
      state.matches = action.payload.matches;
      state.isLoading = false;
      state.error = null;
    },
    fetchMatchesFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    createMatch: (state, action: PayloadAction<ReconciliationMatch>) => {
      if (!state.matches) {
        state.matches = [];
      }
      state.matches.unshift(action.payload);
    },
    updateMatch: (state, action: PayloadAction<ReconciliationMatch>) => {
      if (!state.matches) {
        state.matches = [];
      }
      const index = state.matches.findIndex((m) => m.id === action.payload.id);
      if (index !== -1) {
        state.matches[index] = action.payload;
      }
    },
    approveMatch: (state, action: PayloadAction<string>) => {
      if (!state.matches) {
        state.matches = [];
      }
      const match = state.matches.find((m) => m.id === action.payload);
      if (match) {
        match.status = 'approved';
      }
    },
    rejectMatch: (state, action: PayloadAction<string>) => {
      if (!state.matches) {
        state.matches = [];
      }
      const match = state.matches.find((m) => m.id === action.payload);
      if (match) {
        match.status = 'rejected';
      }
    },
    // Compatibility actions for useApiEnhanced.ts (reconciliationJobsActions)
    fetchJobsStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchJobsSuccess: (state, action: PayloadAction<BackendReconciliationJob[]>) => {
      state.jobs = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    fetchJobsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    createJob: (state, action: PayloadAction<BackendReconciliationJob>) => {
      state.jobs.unshift(action.payload);
    },
    startJob: (state, action: PayloadAction<string>) => {
      const job = state.jobs.find((j) => j.id === action.payload);
      if (job) {
        job.status = 'running';
        job.started_at = new Date().toISOString();
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch Records
    builder
      .addCase(fetchReconciliationRecords.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchReconciliationRecords.fulfilled, (state, action) => {
        state.isLoading = false;
        const payload = action.payload as {
          data?: BackendReconciliationRecord[];
          records?: BackendReconciliationRecord[];
        };
        state.records = payload.data || payload.records || [];
        state.error = null;
      })
      .addCase(fetchReconciliationRecords.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Run Matching
      .addCase(runMatching.pending, (state) => {
        state.isLoading = true;
        state.matchingProgress = 0;
        state.error = null;
      })
      .addCase(runMatching.fulfilled, (state, action) => {
        state.isLoading = false;
        state.matchingProgress = 100;
        state.matchingResults = action.payload as Record<string, unknown> | null;
        state.error = null;
      })
      .addCase(runMatching.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.matchingProgress = 0;
      });
  },
});

export const reconciliationRecordsActions = reconciliationSlice.actions; // Alias for compatibility
export const reconciliationMatchesActions = reconciliationSlice.actions; // Alias for compatibility
export const reconciliationJobsActions = reconciliationSlice.actions; // Alias for compatibility
export default reconciliationSlice.reducer;

