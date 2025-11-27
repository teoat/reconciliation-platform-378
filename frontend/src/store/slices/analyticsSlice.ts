// ============================================================================
// ANALYTICS SLICE
// ============================================================================

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchDashboardData } from '../asyncThunkUtils';
import type { AnalyticsState } from '../types';
import type { DashboardData } from '../../types/backend-aligned';

const initialAnalyticsState: AnalyticsState = {
  dashboardData: null,
  reports: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
};

export const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: initialAnalyticsState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch Dashboard Data
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboardData = action.payload as DashboardData | null;
        state.lastUpdated = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const analyticsActions = analyticsSlice.actions;
export default analyticsSlice.reducer;

