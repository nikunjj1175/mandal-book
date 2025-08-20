'use client';
import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/useToast';
import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  DollarSign,
  AlertCircle,
  Trash2,
  Filter,
  Search
} from 'lucide-react';

interface Notification {
  _id: string;
  action: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
  };
  details: string;
  createdAt: string;
  read: boolean;
  readAt?: string;
  priority: 'low' | 'medium' | 'high';
}

const NOTIFICATION_ICONS: { [key: string]: any } = {
  'user.register': User,
  'user.login': User,
  'contribution.submit': DollarSign,
  'contribution.verify': CheckCircle,
  'contribution.reject': XCircle,
  'system.alert': AlertCircle,
  'admin.action': CheckCircle
};

const PRIORITY_COLORS: { [key: string]: string } = {
  low: 'text-gray-600 dark:text-gray-400',
  medium: 'text-yellow-600 dark:text-yellow-400',
  high: 'text-red-600 dark:text-red-400'
};

const PRIORITY_BADGES: { [key: string]: string } = {
  low: 'badge badge-gray',
  medium: 'badge badge-warning',
  high: 'badge badge-danger'
};

export default function AdminNotificationsClient() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    priority: 'all',
    read: 'all',
    action: 'all'
  });
  const toast = useToast();

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.priority !== 'all') params.append('priority', filters.priority);
      if (filters.read !== 'all') params.append('read', filters.read);
      if (filters.action !== 'all') params.append('action', filters.action);

      const response = await fetch(`/api/admin/notifications?${params}`);
      const result = await response.json();
      
      if (result.ok) {
        setNotifications(result.notifications);
      } else {
        setError(result.error || 'Failed to fetch notifications');
      }
    } catch (err) {
      setError('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/admin/notifications/${notificationId}/read`, {
        method: 'PATCH'
      });

      const result = await response.json();
      if (result.ok) {
        setNotifications(notifications?.map(notification => 
          notification._id === notificationId 
            ? { ...notification, read: true, readAt: new Date().toISOString() } 
            : notification
        ) || []);
        toast.success('Notification marked as read');
      } else {
        toast.error(result.error || 'Failed to mark notification as read');
      }
    } catch (err) {
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/admin/notifications/mark-all-read', {
        method: 'PATCH'
      });

      const result = await response.json();
      if (result.ok) {
        setNotifications(notifications?.map(notification => ({
          ...notification,
          read: true,
          readAt: new Date().toISOString()
        })) || []);
        toast.success('All notifications marked as read');
      } else {
        toast.error(result.error || 'Failed to mark all notifications as read');
      }
    } catch (err) {
      toast.error('Failed to mark all notifications as read');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/admin/notifications/${notificationId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (result.ok) {
        setNotifications(notifications?.filter(notification => notification._id !== notificationId) || []);
        toast.success('Notification deleted');
      } else {
        toast.error(result.error || 'Failed to delete notification');
      }
    } catch (err) {
      toast.error('Failed to delete notification');
    }
  };

  const getActionDisplayName = (action: string) => {
    return action.split('.').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getNotificationIcon = (action: string) => {
    const IconComponent = NOTIFICATION_ICONS[action] || Bell;
    return <IconComponent className="h-5 w-5" />;
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  if (error) {
    return (
      <div className="card p-6 border-red-200 bg-red-50 dark:bg-red-900/20 animate-fade-in">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <p className="text-red-800 dark:text-red-200 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading notifications...</p>
        </div>
      </div>
    );
  }

  const unreadCount = notifications?.filter(notification => !notification.read)?.length || 0;
  const highPriorityCount = notifications?.filter(notification => notification.priority === 'high' && !notification.read)?.length || 0;

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Notifications</p>
              <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{notifications?.length || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="card p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Unread</p>
              <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">{unreadCount}</p>
            </div>
          </div>
        </div>
        
        <div className="card p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">High Priority</p>
              <p className="text-2xl font-bold text-red-800 dark:text-red-200">{highPriorityCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Filter className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Notification Filters</h3>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="btn-secondary flex items-center space-x-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Mark All Read</span>
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="input-modern pl-10"
            />
          </div>
          
          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            className="select-modern"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
          
          <select
            value={filters.read}
            onChange={(e) => setFilters({ ...filters, read: e.target.value })}
            className="select-modern"
          >
            <option value="all">All Status</option>
            <option value="false">Unread</option>
            <option value="true">Read</option>
          </select>
          
          <select
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            className="select-modern"
          >
            <option value="all">All Actions</option>
            <option value="user.register">User Register</option>
            <option value="user.login">User Login</option>
            <option value="contribution.submit">Contribution Submit</option>
            <option value="contribution.verify">Contribution Verify</option>
            <option value="contribution.reject">Contribution Reject</option>
            <option value="system.alert">System Alert</option>
            <option value="admin.action">Admin Action</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {(!notifications || notifications.length === 0) ? (
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">No Notifications</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filters.search || filters.priority !== 'all' || filters.read !== 'all' || filters.action !== 'all'
                ? 'Try adjusting your filters to see more results.' 
                : 'You\'re all caught up! No new notifications.'}
            </p>
          </div>
        ) : (
          notifications?.map((notification) => (
            <div
              key={notification._id}
              className={`card p-6 transition-all duration-200 ${
                !notification.read 
                  ? 'border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-900/10' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className={`p-2 rounded-lg ${
                    notification.priority === 'high' 
                      ? 'bg-red-100 dark:bg-red-900/30' 
                      : notification.priority === 'medium'
                      ? 'bg-yellow-100 dark:bg-yellow-900/30'
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    {getNotificationIcon(notification.action)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                        {getActionDisplayName(notification.action)}
                      </h4>
                      <span className={PRIORITY_BADGES[notification.priority]}>
                        {notification.priority} priority
                      </span>
                      {!notification.read && (
                        <span className="badge badge-blue">New</span>
                      )}
                    </div>
                    
                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                      {notification.details}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      {notification.userId && (
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>{notification.userId.name}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{getTimeAgo(notification.createdAt)}</span>
                      </div>
                      {notification.read && notification.readAt && (
                        <div className="flex items-center space-x-1">
                          <CheckCircle className="h-3 w-3" />
                          <span>Read {getTimeAgo(notification.readAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification._id)}
                      className="btn-secondary text-xs py-2 px-3 flex items-center space-x-1"
                    >
                      <CheckCircle className="h-3 w-3" />
                      <span>Mark Read</span>
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification._id)}
                    className="btn-danger text-xs py-2 px-3 flex items-center space-x-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
