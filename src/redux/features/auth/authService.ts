import { createApi } from '@reduxjs/toolkit/query/react';
import type { AuthState } from './authTypes';
import { coreBaseQuery } from '../../baseQuery';
import { setUser } from './authSlice';

export interface RegisterUserRequest {
    username: string;
    email: string;
    password: string;
    fullName: string;
    fullNameAr: string;
    tenantCode: string;
}

export interface LoginUserRequest {
    username: string;
    password: string;
}

type RegisterUserResponse = AuthState;
type LoginUserResponse = AuthState;

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
        }),
        loginUser: builder.mutation<LoginUserResponse, LoginUserRequest>({
            query: (user) => ({
                url: '/auth/login',
                method: 'POST',
                body: user,
            }),
            async onQueryStarted(_, { dispatch, queryFulfilled }) {
                const { data } = await queryFulfilled;
                dispatch(setUser(data));
            },
        }),
    })
})

export const { useRegisterUserMutation, useLoginUserMutation } = authApi;
