import { apiSlice } from './apiSlice';

export const membersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get all members
    getMembers: builder.query({
      query: () => '/api/members',
      providesTags: ['Members'],
    }),
  }),
});

export const {
  useGetMembersQuery,
} = membersApi;

