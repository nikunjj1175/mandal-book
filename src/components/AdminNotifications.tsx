'use client';
import { useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { Bell, Users, FileText, CheckCircle, XCircle } from 'lucide-react';

interface Notification {
  _id: string;
  action: string;
  targetType: string;
  targetId: string;
  actorUserId?: {
    name: string;
    email: string;
  };
  after?: any;
  createdAt: string;
}

export default function AdminNotifications() {
  const { user } = useAppSelector((state: any) => state.auth);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.role]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/admin/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.notifications?.length || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markNotificationsAsRead = async (notificationIds?: string[]) => {
    try {
      const response = await fetch('/api/admin/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds }),
      });

      if (response.ok) {
        // Refresh notifications to get updated list
        await fetchNotifications();
      }
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  const getNotificationIcon = (action: string) => {
    switch (action) {
      case 'user_register':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'contribution_submit':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'contribution_verify':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'contribution_finalize':
        return <CheckCircle className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationText = (notification: Notification) => {
    switch (notification.action) {
      case 'user_register':
        return `New user registered: ${notification.actorUserId?.name || 'Unknown'}`;
      case 'contribution_submit':
        return `New contribution submitted by ${notification.actorUserId?.name || 'Unknown'}`;
      case 'contribution_verify':
        return `Contribution verified by ${notification.actorUserId?.name || 'Unknown'}`;
      case 'contribution_finalize':
        return `Contribution finalized by ${notification.actorUserId?.name || 'Unknown'}`;
      default:
        return 'New notification';
    }
  };

  const getNotificationLink = (notification: Notification) => {
    switch (notification.action) {
      case 'user_register':
        return '/admin/users';
      case 'contribution_submit':
      case 'contribution_verify':
      case 'contribution_finalize':
        return '/admin/contributions';
      default:
        return '#';
    }
  };

  if (user?.role !== 'admin') return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">Notifications</h3>
            <p className="text-sm text-gray-500">Recent activity</p>
          </div>
          
          <div className="p-2">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                  onClick={() => {
                    markNotificationsAsRead([notification._id]);
                    window.location.href = getNotificationLink(notification);
                  }}
                >
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {getNotificationText(notification)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                    <span className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-block">
                      View Details →
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="p-3 border-t">
              <button
                onClick={() => markNotificationsAsRead()}
                className="w-full text-sm text-gray-600 hover:text-gray-800"
              >
                Mark all as read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
