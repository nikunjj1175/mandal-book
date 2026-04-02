import { apiSlice } from './apiSlice';

export const invoicesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getInvoices: builder.query({
      query: () => '/api/invoices',
      providesTags: ['Invoices'],
    }),
  }),
});

export const { useGetInvoicesQuery } = invoicesApi;

