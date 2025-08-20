import { io, Socket } from 'socket.io-client';
import { store } from '@/store';
import { setSocket, setConnected, setConnecting, setError, setEventReceived } from '@/store/slices/socketSlice';
import { addContribution, updateContribution, removeContribution } from '@/store/slices/contributionsSlice';
import { addNotification } from '@/store/slices/uiSlice';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token?: string) {
    if (this.socket?.connected) return;

    this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      auth: token ? { token } : undefined,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
    });

    this.setupEventListeners();
    store.dispatch(setSocket(this.socket));
    store.dispatch(setConnecting(true));
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
      store.dispatch(setConnected(true));
      store.dispatch(setConnecting(false));
      store.dispatch(setError(null));
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      store.dispatch(setConnected(false));
      
      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      store.dispatch(setError(error.message));
      store.dispatch(setConnecting(false));
      this.reconnectAttempts++;
    });

    // Contribution events
    this.socket.on('contribution:submitted', (data) => {
      console.log('Contribution submitted:', data);
      store.dispatch(setEventReceived('contributionSubmitted'));
      store.dispatch(addContribution(data.contribution));
      store.dispatch(addNotification({
        type: 'success',
        message: 'New contribution submitted!',
        duration: 5000,
      }));
    });

    this.socket.on('contribution:verified', (data) => {
      console.log('Contribution verified:', data);
      store.dispatch(setEventReceived('contributionVerified'));
      store.dispatch(updateContribution({
        id: data.contributionId,
        updates: { status: data.status }
      }));
      store.dispatch(addNotification({
        type: 'success',
        message: `Contribution ${data.status === 'verified' ? 'approved' : 'rejected'}!`,
        duration: 5000,
      }));
    });

    this.socket.on('contribution:finalized', (data) => {
      console.log('Contribution finalized:', data);
      store.dispatch(setEventReceived('contributionFinalized'));
      store.dispatch(updateContribution({
        id: data.contributionId,
        updates: { finalized: true, finalizedAt: new Date() }
      }));
      store.dispatch(addNotification({
        type: 'success',
        message: 'Contribution finalized!',
        duration: 5000,
      }));
    });

    // User events
    this.socket.on('user:status_changed', (data) => {
      console.log('User status changed:', data);
      store.dispatch(setEventReceived('userStatusChanged'));
      store.dispatch(addNotification({
        type: 'info',
        message: `User ${data.userName} status changed to ${data.status}`,
        duration: 5000,
      }));
    });

    // Admin events
    this.socket.on('admin:new_pending', (data) => {
      console.log('New pending contribution for admin:', data);
      store.dispatch(addNotification({
        type: 'info',
        message: `New pending contribution from ${data.userName}`,
        duration: 5000,
      }));
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    store.dispatch(setConnected(false));
    store.dispatch(setConnecting(false));
    store.dispatch(setError(null));
  }

  emit(event: string, data?: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  }

  // Join admin room for real-time updates
  joinAdminRoom() {
    this.emit('admin:join');
  }

  // Leave admin room
  leaveAdminRoom() {
    this.emit('admin:leave');
  }

  // Join user room for personal updates
  joinUserRoom(userId: string) {
    this.emit('user:join', { userId });
  }

  // Leave user room
  leaveUserRoom() {
    this.emit('user:leave');
  }
}

export const socketService = new SocketService();
export default socketService;





