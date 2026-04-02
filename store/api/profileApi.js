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

    setPin: builder.mutation({
      query: ({ pin, confirmPin }) => ({
        url: '/api/user/pin/set',
        method: 'POST',
        body: { pin, confirmPin },
      }),
      invalidatesTags: ['Profile'],
    }),

    resetPin: builder.mutation({
      query: ({ password, newPin, confirmNewPin }) => ({
        url: '/api/user/pin/reset',
        method: 'POST',
        body: { password, newPin, confirmNewPin },
      }),
      invalidatesTags: ['Profile'],
    }),

    verifyPin: builder.mutation({
      query: (body) => ({
        url: '/api/user/pin/verify',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Profile', 'PinHistory'],
    }),
  }),
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useUploadDocumentsMutation,
  useSetPinMutation,
  useResetPinMutation,
  useVerifyPinMutation,
} = profileApi;

