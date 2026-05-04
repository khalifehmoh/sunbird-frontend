import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { AuthState } from './authTypes';
import { coreBaseQuery } from '../../baseQuery';

interface RegisterUserRequest {
    username: string;
    email: string;
    password: string;
    fullName: string;
    fullNameAr: string;
    tenantCode: string;
}

type RegisterUserResponse = AuthState;
    
export const authApi = createApi({
    reducerPath: 'authApi',
    baseQuery: coreBaseQuery,
    endpoints: (builder) => ({
        registerUser: builder.mutation<RegisterUserResponse, RegisterUserRequest>({
            query: (user) => ({
                url: '/auth/register',
                method: 'POST',
                body: user,
            }),
        })
    })
})

export const { useRegisterUserMutation } = authApi;