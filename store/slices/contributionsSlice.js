import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  contributions: [],
  stats: null,
  loading: false,
  error: null,
};

const contributionsSlice = createSlice({
  name: 'contributions',
  initialState,
  reducers: {
    setContributions: (state, action) => {
      state.contributions = action.payload;
    },
    setStats: (state, action) => {
      state.stats = action.payload;
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
  setContributions,
  setStats,
  setLoading,
  setError,
  clearError,
} = contributionsSlice.actions;

export default contributionsSlice.reducer;

