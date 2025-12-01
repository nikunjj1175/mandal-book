import { apiSlice } from './apiSlice';

export const notificationsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get notifications
    getNotifications: builder.query({
      query: () => '/api/notifications',
      providesTags: ['Notifications'],
    }),
    
    // Mark notification as read
    markNotificationRead: builder.mutation({
      query: (notificationId) => ({
        url: `/api/notifications/${notificationId}/read`,
        method: 'PUT',
      }),
      invalidatesTags: ['Notifications'],
    }),
    
    // Mark all notifications as read
    markAllNotificationsRead: builder.mutation({
      query: () => ({
        url: '/api/notifications/read-all',
        method: 'PUT',
      }),
      invalidatesTags: ['Notifications'],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationsApi;

