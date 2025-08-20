import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Payment {
  amount: number;
  utr?: string;
  proof?: { url: string; publicId: string };
  createdAt?: string;
}

export interface Contribution {
  _id: string;
  period: string;
  amount: number;
  status: 'pending' | 'verified' | 'rejected';
  utr?: string;
  proof?: { url: string; publicId: string };
  payments?: Payment[];
  required?: number;
  remaining?: number;
  finalized?: boolean;
  finalizedAt?: Date;
  userId?: { name?: string; email?: string };
  createdAt?: string;
  updatedAt?: string;
}

interface ContributionsState {
  items: Contribution[];
  pendingItems: Contribution[];
  verifiedItems: Contribution[];
  loading: boolean;
  error: string | null;
  monthlyAmount: number;
  filters: {
    start: string;
    end: string;
    status: 'all' | 'pending' | 'verified' | 'rejected';
    finalized: 'false' | 'true' | 'any';
  };
}

const initialState: ContributionsState = {
  items: [],
  pendingItems: [],
  verifiedItems: [],
  loading: false,
  error: null,
  monthlyAmount: 0,
  filters: {
    start: '',
    end: '',
    status: 'all',
    finalized: 'false',
  },
};

// Async thunks
export const fetchMyContributions = createAsyncThunk(
  'contributions/fetchMy',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const { filters } = state.contributions;
      
      const qs = new URLSearchParams();
      if (filters.start) qs.set('start', filters.start);
      if (filters.end) qs.set('end', filters.end);
      if (filters.status && filters.status !== 'all') qs.set('status', filters.status);
      
      const url = qs.toString() ? `/api/contributions/mine?${qs}` : '/api/contributions/mine';
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch');
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchPendingContributions = createAsyncThunk(
  'contributions/fetchPending',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/contributions/pending');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch');
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchVerifiedContributions = createAsyncThunk(
  'contributions/fetchVerified',
  async (filters: { start?: string; end?: string; finalized?: string }, { rejectWithValue }) => {
    try {
      const qs = new URLSearchParams();
      if (filters.start) qs.set('start', filters.start);
      if (filters.end) qs.set('end', filters.end);
      if (filters.finalized) qs.set('finalized', filters.finalized);
      
      const url = qs.toString() ? `/api/admin/contributions/verified?${qs}` : '/api/admin/contributions/verified';
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch');
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const submitContribution = createAsyncThunk(
  'contributions/submit',
  async (payload: { amount: number; utr: string; proof?: { url: string; publicId: string } }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit');
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const verifyContribution = createAsyncThunk(
  'contributions/verify',
  async ({ id, action }: { id: string; action: 'verify' | 'reject' }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/contributions/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to verify');
      return { id, action, data };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const finalizeContribution = createAsyncThunk(
  'contributions/finalize',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/admin/contributions/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to finalize');
      return { id, data };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const contributionsSlice = createSlice({
  name: 'contributions',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<ContributionsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    addContribution: (state, action: PayloadAction<Contribution>) => {
      state.items.unshift(action.payload);
    },
    updateContribution: (state, action: PayloadAction<{ id: string; updates: Partial<Contribution> }>) => {
      const { id, updates } = action.payload;
      const index = state.items.findIndex(item => item._id === id);
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...updates };
      }
      
      const pendingIndex = state.pendingItems.findIndex(item => item._id === id);
      if (pendingIndex !== -1) {
        state.pendingItems[pendingIndex] = { ...state.pendingItems[pendingIndex], ...updates };
      }
      
      const verifiedIndex = state.verifiedItems.findIndex(item => item._id === id);
      if (verifiedIndex !== -1) {
        state.verifiedItems[verifiedIndex] = { ...state.verifiedItems[verifiedIndex], ...updates };
      }
    },
    removeContribution: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      state.items = state.items.filter(item => item._id !== id);
      state.pendingItems = state.pendingItems.filter(item => item._id !== id);
      state.verifiedItems = state.verifiedItems.filter(item => item._id !== id);
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch my contributions
      .addCase(fetchMyContributions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyContributions.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.contributions || [];
        state.monthlyAmount = action.payload.monthlyAmount || 0;
      })
      .addCase(fetchMyContributions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch pending contributions
      .addCase(fetchPendingContributions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPendingContributions.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingItems = action.payload.items || [];
      })
      .addCase(fetchPendingContributions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch verified contributions
      .addCase(fetchVerifiedContributions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVerifiedContributions.fulfilled, (state, action) => {
        state.loading = false;
        state.verifiedItems = action.payload.items || [];
      })
      .addCase(fetchVerifiedContributions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Submit contribution
      .addCase(submitContribution.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitContribution.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(submitContribution.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Verify contribution
      .addCase(verifyContribution.fulfilled, (state, action) => {
        const { id, action: verifyAction } = action.payload;
        const status = verifyAction === 'verify' ? 'verified' : 'rejected';
        
        // Remove from pending
        state.pendingItems = state.pendingItems.filter(item => item._id !== id);
        
        // Update in my contributions
        const myIndex = state.items.findIndex(item => item._id === id);
        if (myIndex !== -1) {
          state.items[myIndex].status = status;
        }
      })
      
      // Finalize contribution
      .addCase(finalizeContribution.fulfilled, (state, action) => {
        const { id } = action.payload;
        // Remove from verified
        state.verifiedItems = state.verifiedItems.filter(item => item._id !== id);
        
        // Update in my contributions
        const myIndex = state.items.findIndex(item => item._id === id);
        if (myIndex !== -1) {
          state.items[myIndex].finalized = true;
          state.items[myIndex].finalizedAt = new Date();
        }
      });
  },
});

export const { setFilters, addContribution, updateContribution, removeContribution, clearError } = contributionsSlice.actions;
export default contributionsSlice.reducer;
