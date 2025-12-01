import { apiSlice } from './apiSlice';

export const contributionsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get user's contributions
    getMyContributions: builder.query({
      query: () => '/api/contribution/my',
      providesTags: ['Contributions'],
    }),
    
    // Upload contribution slip
    uploadContribution: builder.mutation({
      query: (data) => ({
        url: '/api/contribution/upload-slip',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Contributions', 'Dashboard'],
    }),
    
    // Get contribution stats
    getContributionStats: builder.query({
      query: (memberId) => ({
        url: '/api/contribution/stats',
        params: memberId ? { memberId } : {},
      }),
      providesTags: ['Dashboard'],
    }),
    
    // Export contribution data
    exportContributionData: builder.query({
      query: (memberId) => ({
        url: '/api/contribution/export-data',
        params: memberId ? { memberId } : {},
      }),
    }),
  }),
});

export const {
  useGetMyContributionsQuery,
  useUploadContributionMutation,
  useGetContributionStatsQuery,
  useLazyExportContributionDataQuery,
} = contributionsApi;

