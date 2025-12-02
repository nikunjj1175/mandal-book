import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import { useGetNotificationsQuery, useMarkNotificationReadMutation, useMarkAllNotificationsReadMutation } from '@/store/api/notificationsApi';
import { useAppSelector } from '@/store/hooks';

export default function NotificationSystem() {
  const { user } = useAuth();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [currentPopup, setCurrentPopup] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const [mounted, setMounted] = useState(false);
  const [previousUnreadCount, setPreviousUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const popupTimeoutRef = useRef(null);

  // Redux hooks
  const { data: notificationsData, isLoading: loading } = useGetNotificationsQuery(undefined, {
    skip: !user,
    pollingInterval: 30000, // Poll every 30 seconds
  });
  const [markNotificationRead] = useMarkNotificationReadMutation();
  const [markAllNotificationsRead] = useMarkAllNotificationsReadMutation();

  const notifications = notificationsData?.data?.notifications || [];
  const unreadCount = notificationsData?.data?.unreadCount || 0;

  // Show popup notification
  const showNotificationPopup = (notification) => {
    setCurrentPopup(notification);
    setShowPopup(true);
    
    // Auto-hide after 5 seconds
    if (popupTimeoutRef.current) {
      clearTimeout(popupTimeoutRef.current);
    }
    popupTimeoutRef.current = setTimeout(() => {
      setShowPopup(false);
      setCurrentPopup(null);
    }, 5000);
  };

  // Mark notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId).unwrap();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsRead().unwrap();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Close popup
  const closePopup = () => {
    if (popupTimeoutRef.current) {
      clearTimeout(popupTimeoutRef.current);
    }
    setShowPopup(false);
    if (currentPopup && !currentPopup.isRead) {
      handleMarkAsRead(currentPopup._id);
    }
    setCurrentPopup(null);
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'contribution':
        return '💰';
      case 'kyc':
        return '📄';
      case 'loan':
        return '💵';
      case 'system':
        return '🔔';
      default:
        return '📢';
    }
  };

  // Get notification color based on type
  const getNotificationColor = (type) => {
    switch (type) {
      case 'contribution':
        return 'bg-blue-500';
      case 'kyc':
        return 'bg-green-500';
      case 'loan':
        return 'bg-purple-500';
      case 'system':
        return 'bg-indigo-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    handleMarkAsRead(notification._id);
    setShowDropdown(false);
    
    // Navigate based on type
    if (notification.type === 'contribution') {
      router.push('/contributions');
    } else if (notification.type === 'kyc') {
      router.push('/kyc');
    } else if (notification.type === 'loan') {
      router.push('/loans');
    }
  };

  // Set mounted state for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check for new notifications and show popup
  // Popup auto-show only on dashboard/home page (both mobile and desktop)
  useEffect(() => {
    const isDashboard =
      router.pathname === '/dashboard' || router.pathname === '/';

    if (!isDashboard) {
      // Keep unread count in sync but don't show popup on non-dashboard pages
      setPreviousUnreadCount(unreadCount);
      return;
    }

    if (unreadCount > previousUnreadCount && unreadCount > 0) {
      const unreadNotifications = notifications.filter((n) => !n.isRead);
      if (unreadNotifications.length > 0) {
        const latestUnread = unreadNotifications[0];
        showNotificationPopup(latestUnread);
      }
    }

    setPreviousUnreadCount(unreadCount);
  }, [unreadCount, notifications, previousUnreadCount, router.pathname]);

  // Calculate dropdown position when opened
  useEffect(() => {
    if (showDropdown && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const isMobile = window.innerWidth < 640;
      setDropdownPosition({
        top: rect.bottom + 8,
        right: isMobile ? 12 : window.innerWidth - rect.right,
      });
    }
  }, [showDropdown]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && 
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  if (!user) return null;

  return (
    <>
      {/* Notification Bell Icon */}
      <div className="relative" ref={dropdownRef}>
        <button
          ref={buttonRef}
          onClick={() => setShowDropdown(!showDropdown)}
          className="relative inline-flex items-center justify-center rounded-full p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 transition-colors z-[10001]"
          aria-label="Notifications"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Notification Dropdown - Rendered via Portal */}
        {showDropdown && mounted && createPortal(
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-[99999]"
              style={{ backgroundColor: 'transparent' }}
              onClick={() => setShowDropdown(false)}
            />
            {/* Dropdown */}
            <div 
              className="fixed w-[calc(100vw-1.5rem)] sm:w-96 max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 z-[100000] max-h-[70vh] sm:max-h-[500px] overflow-hidden"
              style={{
                top: `${dropdownPosition.top}px`,
                right: `${dropdownPosition.right}px`,
                position: 'fixed',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white dark:bg-slate-800 z-10 p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                  >
                    Mark all as read
                  </button>
                )}
            </div>
            
            {/* Notifications List */}
            <div className="overflow-y-auto max-h-[420px] bg-white dark:bg-slate-800">
                {notifications.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <svg
                      className="h-16 w-16 mx-auto mb-4 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                  <p className="text-base font-medium text-gray-400 dark:text-gray-500">No notifications</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-slate-700">
                  {notifications.map((notification) => (
                    <button
                      key={notification._id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors duration-150 ${
                        !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500 dark:border-l-blue-400' : ''
                      }`}
                    >
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex-shrink-0 w-11 h-11 rounded-full ${getNotificationColor(
                              notification.type
                            )} flex items-center justify-center text-white text-lg shadow-sm`}
                          >
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                            <p
                              className={`text-sm font-semibold leading-tight ${
                                !notification.isRead ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {notification.title}
                            </p>
                            {!notification.isRead && (
                              <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-blue-500 dark:bg-blue-400 mt-1.5"></span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed line-clamp-2">
                            {notification.description}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2.5">
                            {formatDate(notification.createdAt)}
                          </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>,
          document.body
        )}
      </div>

      {/* Popup Notification */}
      {showPopup && currentPopup && (
        <div className="fixed top-16 sm:top-4 inset-x-2 sm:inset-x-auto sm:right-4 z-50 w-auto sm:w-96 max-w-md animate-slide-in-right">
          <div
            className={`bg-white dark:bg-slate-800 rounded-2xl shadow-xl border-l-4 border border-gray-200 dark:border-slate-700 ${
              currentPopup.type === 'contribution'
                ? 'border-blue-500 dark:border-blue-400'
                : currentPopup.type === 'kyc'
                ? 'border-green-500 dark:border-green-400'
                : currentPopup.type === 'loan'
                ? 'border-purple-500 dark:border-purple-400'
                : 'border-indigo-500 dark:border-indigo-400'
            } p-4`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex-shrink-0 w-12 h-12 rounded-full ${getNotificationColor(
                  currentPopup.type
                )} flex items-center justify-center text-white text-xl`}
              >
                {getNotificationIcon(currentPopup.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    {currentPopup.title}
                  </h4>
                  <button
                    onClick={closePopup}
                    className="flex-shrink-0 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label="Close"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{currentPopup.description}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{formatDate(currentPopup.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </>
  );
}

