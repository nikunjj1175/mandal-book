import { apiSlice } from './apiSlice';

export const loansApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get user's loans
    getMyLoans: builder.query({
      query: () => '/api/loan/my',
      providesTags: ['Loans'],
    }),
    
    // Request a loan
    requestLoan: builder.mutation({
      query: (data) => ({
        url: '/api/loan/request',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Loans'],
    }),
    
    // Pay loan installment
    payLoan: builder.mutation({
      query: (data) => ({
        url: '/api/loan/pay',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Loans'],
    }),

    // Get overall mandal fund and available amount for loans
    getLoanFundSummary: builder.query({
      query: () => '/api/loan/fund-summary',
      providesTags: ['Loans'],
    }),
  }),
});

export const {
  useGetMyLoansQuery,
  useRequestLoanMutation,
  usePayLoanMutation,
  useGetLoanFundSummaryQuery,
} = loansApi;

