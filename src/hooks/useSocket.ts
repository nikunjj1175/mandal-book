import { useEffect, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setConnected, setConnecting, setError } from '@/store/slices/socketSlice';
import socketService from '@/lib/socket';

export function useSocket() {
  const { connected, connecting, error } = useAppSelector((state: any) => state.socket);
  const dispatch = useAppDispatch();

  const connect = useCallback((token?: string) => {
    dispatch(setConnecting(true));
    socketService.connect(token);
  }, [dispatch]);

  const disconnect = useCallback(() => {
    socketService.disconnect();
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    socketService.emit(event, data);
  }, []);

  const joinAdminRoom = useCallback(() => {
    socketService.joinAdminRoom();
  }, []);

  const leaveAdminRoom = useCallback(() => {
    socketService.leaveAdminRoom();
  }, []);

  const joinUserRoom = useCallback((userId: string) => {
    socketService.joinUserRoom(userId);
  }, []);

  const leaveUserRoom = useCallback(() => {
    socketService.leaveUserRoom();
  }, []);

  return {
    connected,
    connecting,
    error,
    connect,
    disconnect,
    emit,
    joinAdminRoom,
    leaveAdminRoom,
    joinUserRoom,
    leaveUserRoom,
  };
}
