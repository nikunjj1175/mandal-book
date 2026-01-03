import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { encryptDatesInObject, decryptDatesInObject } from '@/lib/dateEncryptionClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState }) => {
    // Get token from localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
    }
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  // Encrypt dates in request body before sending
  if (args.body && typeof args.body === 'object') {
    args.body = await encryptDatesInObject(args.body);
  }
  
  let result = await baseQuery(args, api, extraOptions);
  
  // Decrypt dates in response data
  if (result.data && typeof result.data === 'object') {
    result.data = await decryptDatesInObject(result.data);
  }
  
  if (result?.error?.status === 401) {
    // Handle unauthorized - clear token and redirect
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }
  
  return result;
};

export const apiSlice = createApi({
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Contributions',
    'Loans',
    'Profile',
    'Notifications',
    'Dashboard',
    'Admin',
    'Members',
    'KYC',
    'Settings',
    'PaymentSettings',
  ],
  endpoints: (builder) => ({}),
});

