import { notifications } from '@mantine/notifications';
import { fetchBaseQuery, type BaseQueryApi, type RootState, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react';

interface ErrorResponse {
    message: string;
    error: string;
    status: number;
    timestamp: string;
    errors: string[];
}

const rawBaseQuery = fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL,
    prepareHeaders: (headers, api) => {
      const token = (api.getState()).auth.accessToken;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
});

export const coreBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api: BaseQueryApi, extraOptions: object) => {
    const result = await rawBaseQuery(args, api, extraOptions);

    if (result.error) {
        const { data } = result.error as { data: ErrorResponse };
        if (data.message) {
            const message = data.message
            notifications.show({
                color: 'red',
                title: 'Error',
                message,
                autoClose: 5000,
            });
        }
    }
    return result;
}