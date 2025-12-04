import { apiSlice } from './apiSlice';

export const settingsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get payment settings (public)
    getPaymentSettings: builder.query({
      query: () => '/api/settings/payment',
      providesTags: ['PaymentSettings'],
    }),
  }),
});

export const {
  useGetPaymentSettingsQuery,
} = settingsApi;

