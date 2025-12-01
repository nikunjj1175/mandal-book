import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  stats: null,
  globalStats: null,
  contributionHistory: [],
  loading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setStats: (state, action) => {
      state.stats = action.payload;
    },
    setGlobalStats: (state, action) => {
      state.globalStats = action.payload;
    },
    setContributionHistory: (state, action) => {
      state.contributionHistory = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setStats,
  setGlobalStats,
  setContributionHistory,
  setLoading,
  setError,
  clearError,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;

