import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  loans: [],
  loading: false,
  error: null,
};

const loansSlice = createSlice({
  name: 'loans',
  initialState,
  reducers: {
    setLoans: (state, action) => {
      state.loans = action.payload;
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
  setLoans,
  setLoading,
  setError,
  clearError,
} = loansSlice.actions;

export default loansSlice.reducer;

