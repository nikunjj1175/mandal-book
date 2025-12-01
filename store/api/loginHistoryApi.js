import { apiSlice } from './apiSlice';

export const loginHistoryApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get login history
    getLoginHistory: builder.query({
      query: ({ page = 1, limit = 50, userId }) => ({
        url: '/api/auth/login-history',
        params: { page, limit, ...(userId && { userId }) },
      }),
      providesTags: ['LoginHistory'],
    }),
    
    // Get members (for admin filter)
    getMembersForFilter: builder.query({
      query: () => '/api/admin/members',
      providesTags: ['Members'],
    }),
  }),
});

export const {
  useGetLoginHistoryQuery,
  useGetMembersForFilterQuery,
} = loginHistoryApi;

