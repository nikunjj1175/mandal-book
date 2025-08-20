import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Socket } from 'socket.io-client';

interface SocketState {
  socket: Socket | null;
  connected: boolean;
  connecting: boolean;
  error: string | null;
  events: {
    contributionSubmitted: boolean;
    contributionVerified: boolean;
    contributionFinalized: boolean;
    userStatusChanged: boolean;
  };
}

const initialState: SocketState = {
  socket: null,
  connected: false,
  connecting: false,
  error: null,
  events: {
    contributionSubmitted: false,
    contributionVerified: false,
    contributionFinalized: false,
    userStatusChanged: false,
  },
};

const socketSlice = createSlice({
  name: 'socket',
  initialState,
  reducers: {
    setSocket: (state, action: PayloadAction<Socket>) => {
      state.socket = action.payload as any;
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.connected = action.payload;
      state.connecting = false;
      if (!action.payload) {
        state.error = null;
      }
    },
    setConnecting: (state, action: PayloadAction<boolean>) => {
      state.connecting = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.connecting = false;
    },
    setEventReceived: (state, action: PayloadAction<keyof SocketState['events']>) => {
      state.events[action.payload] = true;
    },
    clearEvent: (state, action: PayloadAction<keyof SocketState['events']>) => {
      state.events[action.payload] = false;
    },
    disconnect: (state) => {
      if (state.socket) {
        state.socket.disconnect();
      }
      state.socket = null;
      state.connected = false;
      state.connecting = false;
      state.error = null;
    },
  },
});

export const {
  setSocket,
  setConnected,
  setConnecting,
  setError,
  setEventReceived,
  clearEvent,
  disconnect,
} = socketSlice.actions;

export default socketSlice.reducer;





