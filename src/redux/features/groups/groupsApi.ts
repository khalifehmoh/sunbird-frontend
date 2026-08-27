import { createApi } from '@reduxjs/toolkit/query/react'
import { coreBaseQuery } from '../../baseQuery'
import type { PagedResponse } from '../../../lib/paging'
import { usersApi } from '../users/usersApi'
export type {
  GroupStatus,
  GroupListItem,
  GetGroupsArgs,
  CreateGroupRequest,
  GroupMemberItem,
  GroupRoleItem,
  RoleOption,
} from './groupsTypes'

import type {
  GroupListItem,
  GetGroupsArgs,
  CreateGroupRequest,
  GroupMemberItem,
  GroupRoleItem,
  RoleOption,
} from './groupsTypes'

export const groupsApi = createApi({
  reducerPath: 'groupsApi',
  baseQuery: coreBaseQuery,
  tagTypes: ['GroupList', 'Group', 'GroupMembers', 'GroupRoles', 'RoleList'],
  endpoints: (builder) => ({
    getGroups: builder.query<PagedResponse<GroupListItem>, GetGroupsArgs>({
      query: ({ page, size, search, status, tenantId, sort }) => {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('size', String(size))
        if (search.trim()) params.set('search', search.trim())
        if (status) params.set('status', status)
        if (tenantId) params.set('tenantId', tenantId)
        if (sort) params.set('sort', sort)
        const q = params.toString()
        return `/groups${q ? `?${q}` : ''}`
      },
      providesTags: [{ type: 'GroupList', id: 'LIST' }],
    }),
    getGroup: builder.query<GroupListItem, string>({
      query: (groupId) => `/groups/${groupId}`,
      providesTags: (_result, _error, groupId) => [
        { type: 'Group', id: groupId },
      ],
    }),
    createGroup: builder.mutation<GroupListItem, CreateGroupRequest>({
      query: (group) => ({
        url: '/groups',
        method: 'POST',
        body: group,
      }),
      invalidatesTags: (_, error) =>
        error ? [] : [{ type: 'GroupList', id: 'LIST' }],
    }),
    updateGroup: builder.mutation<GroupListItem, CreateGroupRequest>({
      query: (group) => ({
        url: `/groups/${group.groupId}`,
        method: 'PUT',
        body: group,
      }),
      invalidatesTags: (_, error, group) =>
        error
          ? []
          : [
              { type: 'GroupList', id: 'LIST' },
              ...(group.groupId
                ? [{ type: 'Group' as const, id: group.groupId }]
                : []),
            ],
      async onQueryStarted(_group, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
          dispatch(
            usersApi.util.invalidateTags([
              { type: 'UserGroups' },
              { type: 'UserRoles' },
              { type: 'UserEffectivePermissions' },
            ]),
          )
        } catch {
          // Shared base query shows API errors.
        }
      },
    }),
    deleteGroup: builder.mutation<void, string>({
      query: (groupId) => ({
        url: `/groups/${groupId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_, error, groupId) =>
        error
          ? []
          : [
              { type: 'GroupList', id: 'LIST' },
              { type: 'Group', id: groupId },
              { type: 'GroupMembers', id: groupId },
              { type: 'GroupRoles', id: groupId },
            ],
      async onQueryStarted(_groupId, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
          dispatch(
            usersApi.util.invalidateTags([
              { type: 'UserGroups' },
              { type: 'UserRoles' },
              { type: 'UserEffectivePermissions' },
            ]),
          )
        } catch {
          // Shared base query shows API errors.
        }
      },
    }),
    getGroupMembers: builder.query<GroupMemberItem[], string>({
      query: (groupId) => `/groups/${groupId}/members`,
      providesTags: (_result, _error, groupId) => [
        { type: 'GroupMembers', id: groupId },
      ],
    }),
    addGroupMember: builder.mutation<
      GroupMemberItem,
      { groupId: string; userId: string }
    >({
      query: ({ groupId, userId }) => ({
        url: `/groups/${groupId}/members/${userId}`,
        method: 'POST',
      }),
      invalidatesTags: (_result, error, { groupId }) =>
        error
          ? []
          : [
              { type: 'GroupList', id: 'LIST' },
              { type: 'Group', id: groupId },
              { type: 'GroupMembers', id: groupId },
              { type: 'GroupRoles', id: groupId },
            ],
      async onQueryStarted({ userId }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
          dispatch(
            usersApi.util.invalidateTags([
              { type: 'UserGroups', id: userId },
              { type: 'UserRoles', id: userId },
              { type: 'UserEffectivePermissions', id: userId },
            ]),
          )
        } catch {
          // Shared base query shows API errors.
        }
      },
    }),
    removeGroupMember: builder.mutation<
      void,
      { groupId: string; userId: string }
    >({
      query: ({ groupId, userId }) => ({
        url: `/groups/${groupId}/members/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, error, { groupId }) =>
        error
          ? []
          : [
              { type: 'GroupList', id: 'LIST' },
              { type: 'Group', id: groupId },
              { type: 'GroupMembers', id: groupId },
              { type: 'GroupRoles', id: groupId },
            ],
      async onQueryStarted({ userId }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
          dispatch(
            usersApi.util.invalidateTags([
              { type: 'UserGroups', id: userId },
              { type: 'UserRoles', id: userId },
              { type: 'UserEffectivePermissions', id: userId },
            ]),
          )
        } catch {
          // Shared base query shows API errors.
        }
      },
    }),
    getGroupRoles: builder.query<GroupRoleItem[], string>({
      query: (groupId) => `/groups/${groupId}/roles`,
      providesTags: (_result, _error, groupId) => [
        { type: 'GroupRoles', id: groupId },
      ],
    }),
    assignGroupRole: builder.mutation<
      GroupRoleItem,
      { groupId: string; roleId: string }
    >({
      query: ({ groupId, roleId }) => ({
        url: `/groups/${groupId}/roles/${roleId}`,
        method: 'POST',
      }),
      invalidatesTags: (_result, error, { groupId }) =>
        error
          ? []
          : [
              { type: 'GroupList', id: 'LIST' },
              { type: 'Group', id: groupId },
              { type: 'GroupRoles', id: groupId },
            ],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
          dispatch(
            usersApi.util.invalidateTags([
              { type: 'UserEffectivePermissions' },
              { type: 'UserRoles' }
            ]),
          )
        } catch {
          // Shared base query shows API errors.
        }
      },
    }),
    revokeGroupRole: builder.mutation<
      void,
      { groupId: string; roleId: string }
    >({
      query: ({ groupId, roleId }) => ({
        url: `/groups/${groupId}/roles/${roleId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, error, { groupId }) =>
        error
          ? []
          : [
              { type: 'GroupList', id: 'LIST' },
              { type: 'Group', id: groupId },
              { type: 'GroupRoles', id: groupId },
            ],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
          dispatch(
            usersApi.util.invalidateTags([
              { type: 'UserEffectivePermissions' },
              { type: 'UserRoles' },
            ]),
          )
        } catch {
          // Shared base query shows API errors.
        }
      },
    }),
    getAssignableRoles: builder.query<RoleOption[], string | undefined>({
      query: (tenantId) => {
        const params = new URLSearchParams()
        if (tenantId) params.set('tenantId', tenantId)
        const q = params.toString()
        return `/roles${q ? `?${q}` : ''}`
      },
      providesTags: [{ type: 'RoleList', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetGroupsQuery,
  useGetGroupQuery,
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
  useGetGroupMembersQuery,
  useAddGroupMemberMutation,
  useRemoveGroupMemberMutation,
  useGetGroupRolesQuery,
  useAssignGroupRoleMutation,
  useRevokeGroupRoleMutation,
  useGetAssignableRolesQuery,
} = groupsApi
