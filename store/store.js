import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from './api/apiSlice';
import contributionsSlice from './slices/contributionsSlice';
import loansSlice from './slices/loansSlice';
import profileSlice from './slices/profileSlice';
import notificationsSlice from './slices/notificationsSlice';
import dashboardSlice from './slices/dashboardSlice';
import adminSlice from './slices/adminSlice';

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    contributions: contributionsSlice,
    loans: loansSlice,
    profile: profileSlice,
    notifications: notificationsSlice,
    dashboard: dashboardSlice,
    admin: adminSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

// Type exports for TypeScript (if needed)
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;

