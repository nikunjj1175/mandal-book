import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface UIState {
  notifications: Notification[];
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  loadingStates: {
    [key: string]: boolean;
  };
  modals: {
    [key: string]: boolean;
  };
}

const initialState: UIState = {
  notifications: [],
  sidebarOpen: false,
  theme: 'system',
  loadingStates: {},
  modals: {},
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
      const id = Date.now().toString();
      state.notifications.push({ ...action.payload, id });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    setLoadingState: (state, action: PayloadAction<{ key: string; loading: boolean }>) => {
      const { key, loading } = action.payload;
      state.loadingStates[key] = loading;
    },
    setModalOpen: (state, action: PayloadAction<{ key: string; open: boolean }>) => {
      const { key, open } = action.payload;
      state.modals[key] = open;
    },
  },
});

export const {
  addNotification,
  removeNotification,
  clearNotifications,
  setSidebarOpen,
  setTheme,
  setLoadingState,
  setModalOpen,
} = uiSlice.actions;

export default uiSlice.reducer;





