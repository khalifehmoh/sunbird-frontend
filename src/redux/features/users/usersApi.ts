import { createApi } from '@reduxjs/toolkit/query/react'
import { coreBaseQuery } from '../../baseQuery'
import type { PagedResponse } from '../../../lib/paging'
export type {
  UserStatus,
  UserRole,
  UserListItem,
  GetUsersArgs,
  CreateUserRequest,
  UserSessionItem,
} from './usersTypes'

import type {
  UserListItem,
  GetUsersArgs,
  CreateUserRequest,
  UserSessionItem,
  UserStatus,
} from './usersTypes'

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: coreBaseQuery,
  tagTypes: ['UserList', 'User', 'UserSessions'],
  endpoints: (builder) => ({
    getUsers: builder.query<PagedResponse<UserListItem>, GetUsersArgs>({
      query: ({ page, size, search, status, tenantId, sort }) => {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('size', String(size))
        if (search.trim()) params.set('search', search.trim())
        if (status) params.set('status', status)
        if (tenantId) params.set('tenantId', tenantId)
        if (sort) params.set('sort', sort)
        const q = params.toString()
        return `/users${q ? `?${q}` : ''}`
      },
      providesTags: [{ type: 'UserList', id: 'LIST' }],
    }),
    getUser: builder.query<UserListItem, string>({
      query: (userId) => `/users/${userId}`,
      providesTags: (_result, _error, userId) => [{ type: 'User', id: userId }],
    }),
    createUser: builder.mutation<UserListItem, CreateUserRequest>({
      query: (user) => ({
        url: '/users',
        method: 'POST',
        body: user,
      }),
      invalidatesTags: (_, error) =>
        error ? [] : [{ type: 'UserList', id: 'LIST' }],
    }),
    updateUser: builder.mutation<UserListItem, CreateUserRequest>({
      query: (user) => ({
        url: `/users/${user.userId}`,
        method: 'PUT',
        body: user,
      }),
      invalidatesTags: (_, error, user) =>
        error
          ? []
          : [
              { type: 'UserList', id: 'LIST' },
              ...(user.userId
                ? [{ type: 'User' as const, id: user.userId }]
                : []),
            ],
    }),
    deleteUser: builder.mutation<void, string>({
      query: (userId) => ({
        url: `/users/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_, error, userId) =>
        error
          ? []
          : [
              { type: 'UserList', id: 'LIST' },
              { type: 'User', id: userId },
            ],
    }),
    patchUserStatus: builder.mutation<
      UserListItem,
      { userId: string; status: UserStatus }
    >({
      query: ({ userId, status }) => ({
        url: `/users/${userId}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_result, error, { userId }) =>
        error
          ? []
          : [
              { type: 'UserList', id: 'LIST' },
              { type: 'User', id: userId },
            ],
    }),
    bulkPatchUserStatus: builder.mutation<
      { updated: number },
      { userIds: string[]; status: UserStatus }
    >({
      query: (body) => ({
        url: '/users/bulk-status',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_, error) =>
        error ? [] : [{ type: 'UserList', id: 'LIST' }],
    }),
    resetUserPassword: builder.mutation<UserListItem, string>({
      query: (userId) => ({
        url: `/users/${userId}/reset-password`,
        method: 'POST',
      }),
      invalidatesTags: (_result, error, userId) =>
        error
          ? []
          : [
              { type: 'User', id: userId },
              { type: 'UserSessions', id: userId },
            ],
    }),
    getUserSessions: builder.query<UserSessionItem[], string>({
      query: (userId) => `/users/${userId}/sessions`,
      providesTags: (_result, _error, userId) => [
        { type: 'UserSessions', id: userId },
      ],
    }),
    terminateSession: builder.mutation<void, { sessionId: string; userId: string }>({
      query: ({ sessionId }) => ({
        url: `/sessions/${sessionId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, error, { userId }) =>
        error ? [] : [{ type: 'UserSessions', id: userId }],
    }),
    terminateAllSessions: builder.mutation<{ terminated: number }, string>({
      query: (userId) => ({
        url: `/users/${userId}/sessions/all`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, error, userId) =>
        error ? [] : [{ type: 'UserSessions', id: userId }],
    }),
  }),
})

export const {
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  usePatchUserStatusMutation,
  useBulkPatchUserStatusMutation,
  useResetUserPasswordMutation,
  useGetUserSessionsQuery,
  useTerminateSessionMutation,
  useTerminateAllSessionsMutation,
} = usersApi
