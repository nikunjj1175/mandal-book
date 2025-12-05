import { apiSlice } from './apiSlice';

export const adminApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get admin overview
    getAdminOverview: builder.query({
      query: () => '/api/admin/overview',
      providesTags: ['Admin'],
    }),
    
    // Get pending users
    getPendingUsers: builder.query({
      query: () => '/api/admin/users/pending',
      providesTags: ['Admin'],
    }),
    
    // Approve user
    approveUser: builder.mutation({
      query: (userId) => ({
        url: `/api/admin/users/approve`,
        method: 'POST',
        body: { userId },
      }),
      invalidatesTags: ['Admin'],
    }),
    
    // Reject user
    rejectUser: builder.mutation({
      query: (userId) => ({
        url: `/api/admin/users/reject`,
        method: 'POST',
        body: { userId },
      }),
      invalidatesTags: ['Admin'],
    }),
    
    // Get pending KYC
    getPendingKYC: builder.query({
      query: () => '/api/admin/kyc/pending',
      providesTags: ['KYC'],
    }),
    
    // Approve KYC
    approveKYC: builder.mutation({
      query: (userId) => ({
        url: `/api/admin/kyc/approve`,
        method: 'POST',
        body: { userId },
      }),
      invalidatesTags: ['KYC', 'Admin'],
    }),
    
    // Reject KYC
    rejectKYC: builder.mutation({
      query: ({ userId, reason }) => ({
        url: `/api/admin/kyc/reject`,
        method: 'POST',
        body: { userId, reason },
      }),
      invalidatesTags: ['KYC', 'Admin'],
    }),
    
    // Get pending contributions
    getPendingContributions: builder.query({
      query: () => '/api/admin/contribution/pending',
      providesTags: ['Contributions'],
    }),
    
    // Approve contribution
    approveContribution: builder.mutation({
      query: (contributionId) => ({
        url: `/api/admin/contribution/approve`,
        method: 'POST',
        body: { contributionId },
      }),
      invalidatesTags: ['Contributions', 'Admin', 'Dashboard'],
    }),
    
    // Reject contribution
    rejectContribution: builder.mutation({
      query: ({ contributionId, reason }) => ({
        url: `/api/admin/contribution/reject`,
        method: 'POST',
        body: { contributionId, reason },
      }),
      invalidatesTags: ['Contributions', 'Admin', 'Dashboard'],
    }),
    
    // Get pending loans
    getPendingLoans: builder.query({
      query: (status) => ({
        url: '/api/admin/loan/list',
        params: status ? { status } : {},
      }),
      providesTags: ['Loans'],
    }),
    
    // Approve loan
    approveLoan: builder.mutation({
      query: ({ loanId, interestRate, duration }) => ({
        url: `/api/admin/loan/approve`,
        method: 'POST',
        body: { loanId, interestRate, duration },
      }),
      invalidatesTags: ['Loans', 'Admin'],
    }),
    
    // Reject loan
    rejectLoan: builder.mutation({
      query: ({ loanId, reason }) => ({
        url: `/api/admin/loan/reject`,
        method: 'POST',
        body: { loanId, reason },
      }),
      invalidatesTags: ['Loans', 'Admin'],
    }),
    
    // Approve loan installment
    approveInstallment: builder.mutation({
      query: ({ loanId, installmentIndex }) => ({
        url: `/api/admin/loan/installment-approve`,
        method: 'POST',
        body: { loanId, installmentIndex },
      }),
      invalidatesTags: ['Loans', 'Admin'],
    }),
    
    // Reject loan installment
    rejectInstallment: builder.mutation({
      query: ({ loanId, installmentIndex, reason }) => ({
        url: `/api/admin/loan/installment-reject`,
        method: 'POST',
        body: { loanId, installmentIndex, reason },
      }),
      invalidatesTags: ['Loans', 'Admin'],
    }),
    
    // Get all members
    getAllMembers: builder.query({
      query: () => '/api/admin/members',
      providesTags: ['Members'],
    }),
    
    // Get member by ID
    getMemberById: builder.query({
      query: (memberId) => `/api/admin/members/${memberId}`,
      providesTags: ['Members'],
    }),
    
    // Activate user
    activateUser: builder.mutation({
      query: ({ userId }) => ({
        url: `/api/admin/users/activate`,
        method: 'POST',
        body: { userId },
      }),
      invalidatesTags: ['Members', 'Admin'],
    }),
    
    // Deactivate user
    deactivateUser: builder.mutation({
      query: ({ userId, reason }) => ({
        url: `/api/admin/users/deactivate`,
        method: 'POST',
        body: { userId, reason },
      }),
      invalidatesTags: ['Members', 'Admin'],
    }),
    
    // Get payment settings (admin)
    getAdminPaymentSettings: builder.query({
      query: () => '/api/admin/settings/payment',
      providesTags: ['Settings'],
    }),
    
    // Update payment settings
    updatePaymentSettings: builder.mutation({
      query: (data) => ({
        url: '/api/admin/settings/payment',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Settings'],
    }),
  }),
});

export const {
  useGetAdminOverviewQuery,
  useGetPendingUsersQuery,
  useApproveUserMutation,
  useRejectUserMutation,
  useGetPendingKYCQuery,
  useApproveKYCMutation,
  useRejectKYCMutation,
  useGetPendingContributionsQuery,
  useApproveContributionMutation,
  useRejectContributionMutation,
  useGetPendingLoansQuery,
  useApproveLoanMutation,
  useRejectLoanMutation,
  useApproveInstallmentMutation,
  useRejectInstallmentMutation,
  useGetAllMembersQuery,
  useGetMemberByIdQuery,
  useActivateUserMutation,
  useDeactivateUserMutation,
  useGetAdminPaymentSettingsQuery,
  useUpdatePaymentSettingsMutation,
} = adminApi;

