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
    forgotPassword: builder.mutation({
      query: ({ email }) => ({
        url: '/api/auth/forgot-password',
        method: 'POST',
        body: { email },
      }),
    }),
    verifyResetOtp: builder.mutation({
      query: ({ email, otp }) => ({
        url: '/api/auth/verify-reset-otp',
        method: 'POST',
        body: { email, otp },
      }),
    }),
    resetPassword: builder.mutation({
      query: ({ email, otp, newPassword }) => ({
        url: '/api/auth/reset-password',
        method: 'POST',
        body: { email, otp, newPassword },
      }),
    }),
  }),
});

export const { useVerifyOtpMutation, useForgotPasswordMutation, useVerifyResetOtpMutation, useResetPasswordMutation } = authApi;


