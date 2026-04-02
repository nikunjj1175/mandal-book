import { apiSlice } from './apiSlice';

export const tripsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTrips: builder.query({
      query: () => '/api/trips',
      providesTags: ['Trips'],
    }),
    getTripDetail: builder.query({
      query: (id) => `/api/trips/${id}?detail=1`,
      providesTags: (result, err, id) => [{ type: 'Trips', id }],
    }),
    createTrip: builder.mutation({
      query: (body) => ({ url: '/api/trips', method: 'POST', body }),
      invalidatesTags: ['Trips'],
    }),
    updateTrip: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/trips/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (r, e, { id }) => ['Trips', { type: 'Trips', id }],
    }),
    deleteTrip: builder.mutation({
      query: (id) => ({ url: `/api/trips/${id}`, method: 'DELETE' }),
      invalidatesTags: (r, e, id) => ['Trips', { type: 'Trips', id }],
    }),
    addTripMember: builder.mutation({
      query: ({ tripId, ...body }) => ({
        url: `/api/trips/${tripId}/members`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (r, e, { tripId }) => ['Trips', { type: 'Trips', id: tripId }],
    }),
    removeTripMember: builder.mutation({
      query: ({ tripId, memberKey }) => ({
        url: `/api/trips/${tripId}/members`,
        method: 'POST',
        body: { action: 'remove', memberKey },
      }),
      invalidatesTags: (r, e, { tripId }) => ['Trips', { type: 'Trips', id: tripId }],
    }),
    getTripExpenses: builder.query({
      query: (tripId) => `/api/trips/${tripId}/expenses`,
      providesTags: (r, e, tripId) => [{ type: 'Trips', id: tripId }],
    }),
    createTripExpense: builder.mutation({
      query: ({ tripId, ...body }) => ({
        url: `/api/trips/${tripId}/expenses`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (r, e, { tripId }) => ['Trips', { type: 'Trips', id: tripId }],
    }),
    deleteTripExpense: builder.mutation({
      query: ({ tripId, expenseId }) => ({
        url: `/api/trips/${tripId}/expenses/${expenseId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (r, e, { tripId }) => ['Trips', { type: 'Trips', id: tripId }],
    }),
  }),
});

export const {
  useGetTripsQuery,
  useGetTripDetailQuery,
  useCreateTripMutation,
  useUpdateTripMutation,
  useDeleteTripMutation,
  useAddTripMemberMutation,
  useRemoveTripMemberMutation,
  useGetTripExpensesQuery,
  useCreateTripExpenseMutation,
  useDeleteTripExpenseMutation,
} = tripsApi;
