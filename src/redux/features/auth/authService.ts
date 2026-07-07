import { createApi } from '@reduxjs/toolkit/query/react'
import { z } from 'zod'
import type { SessionProfile } from './authTypes'
import { coreBaseQuery } from '../../baseQuery'
import { logout, setUser } from './authSlice'

export const passwordComplexitySchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[0-9]/, 'Password must contain a digit')
  .regex(/[^A-Za-z0-9]/, 'Password must contain a special character')

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordComplexitySchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'New password must be different from the current password',
    path: ['newPassword'],
  })

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>

export const passwordRequirements = [
  'At least 8 characters',
  'One uppercase letter',
  'One lowercase letter',
  'One digit',
  'One special character',
]

export interface RegisterUserRequest {
  username: string
  email: string
  password: string
  fullName: string
  fullNameAr: string
  tenantCode: string
}

export interface LoginUserRequest {
  username: string
  password: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface ChangePasswordResponse {
  message: string
  requirePasswordChange: boolean
}

type LoginUserResponse = SessionProfile

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: coreBaseQuery,
  tagTypes: ['Session'],
  endpoints: (builder) => ({
    registerUser: builder.mutation<void, RegisterUserRequest>({
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
        const { data } = await queryFulfilled
        dispatch(setUser(data))
      },
      invalidatesTags: ['Session'],
    }),
    getSession: builder.query<SessionProfile, void>({
      query: () => '/auth/session',
      providesTags: ['Session'],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(setUser(data))
        } catch {
          dispatch(logout())
        }
      },
    }),
    logoutUser: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
        } finally {
          dispatch(logout())
        }
      },
      invalidatesTags: ['Session'],
    }),
    changePassword: builder.mutation<ChangePasswordResponse, ChangePasswordRequest>({
      query: (body) => ({
        url: '/auth/change-password',
        method: 'PUT',
        body,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        await queryFulfilled
        dispatch(logout())
      },
      invalidatesTags: ['Session'],
    }),
  }),
})

export const {
  useRegisterUserMutation,
  useLoginUserMutation,
  useGetSessionQuery,
  useLogoutUserMutation,
  useChangePasswordMutation,
} = authApi
