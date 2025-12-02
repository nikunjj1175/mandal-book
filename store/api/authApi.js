import { apiSlice } from './apiSlice';

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    verifyOtp: builder.mutation({
      query: ({ email, otp }) => ({
        url: '/api/auth/verify-otp',
        method: 'POST',
        body: { email, otp },
      }),
    }),
  }),
});

export const { useVerifyOtpMutation } = authApi;


