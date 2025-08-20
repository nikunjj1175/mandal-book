import { configureStore } from '@reduxjs/toolkit';
import contributionsReducer from './slices/contributionsSlice';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import socketReducer from './slices/socketSlice';

export const store = configureStore({
  reducer: {
    contributions: contributionsReducer,
    auth: authReducer,
    ui: uiReducer,
    socket: socketReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['socket/connect', 'socket/disconnect'],
        ignoredPaths: ['socket.socket'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;





