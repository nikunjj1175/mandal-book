import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  overview: null,
  pendingUsers: [],
  pendingKYC: [],
  pendingContributions: [],
  pendingLoans: [],
  members: [],
  selectedMember: null,
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setOverview: (state, action) => {
      state.overview = action.payload;
    },
    setPendingUsers: (state, action) => {
      state.pendingUsers = action.payload;
    },
    setPendingKYC: (state, action) => {
      state.pendingKYC = action.payload;
    },
    setPendingContributions: (state, action) => {
      state.pendingContributions = action.payload;
    },
    setPendingLoans: (state, action) => {
      state.pendingLoans = action.payload;
    },
    setMembers: (state, action) => {
      state.members = action.payload;
    },
    setSelectedMember: (state, action) => {
      state.selectedMember = action.payload;
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
  setOverview,
  setPendingUsers,
  setPendingKYC,
  setPendingContributions,
  setPendingLoans,
  setMembers,
  setSelectedMember,
  setLoading,
  setError,
  clearError,
} = adminSlice.actions;

export default adminSlice.reducer;

