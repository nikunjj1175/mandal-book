'use client';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSocket } from '@/hooks/useSocket';
import { useAppDispatch } from '@/store/hooks';
import { setUser } from '@/store/slices/authSlice';

export default function SocketProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { connect, disconnect } = useSocket();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (status === 'loading') return;

    if (session?.user) {
      // Set user in Redux store
      dispatch(setUser({
        id: (session.user as any).id,
        name: session.user.name || '',
        email: session.user.email || '',
        role: (session.user as any).role || 'member',
        status: 'active', // Default status
      }));

      // Connect to Socket.IO with user token
      connect((session.user as any).id);
    } else {
      // Disconnect if no session
      disconnect();
      dispatch(setUser(null));
    }

    return () => {
      disconnect();
    };
  }, [session, status, connect, disconnect, dispatch]);

  return <>{children}</>;
}





