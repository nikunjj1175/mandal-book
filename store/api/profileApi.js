import { apiSlice } from './apiSlice';

export const profileApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get user profile
    getProfile: builder.query({
      query: () => '/api/auth/me',
      providesTags: ['Profile'],
    }),
    
    // Update profile
    updateProfile: builder.mutation({
      query: (data) => ({
        url: '/api/user/update-profile',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Profile'],
    }),
    
    // Upload KYC documents
    uploadDocuments: builder.mutation({
      query: (data) => ({
        url: '/api/user/upload-documents',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Profile', 'KYC'],
    }),
  }),
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useUploadDocumentsMutation,
} = profileApi;

