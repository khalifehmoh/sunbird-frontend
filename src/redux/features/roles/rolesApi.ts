import { createApi } from '@reduxjs/toolkit/query/react'
import { coreBaseQuery } from '../../baseQuery'
import type { PagedResponse } from '../../../lib/paging'
export type {
  RoleStatus,
  RoleListItem,
  GetRolesArgs,
  CreateRoleRequest,
  RolePermissionItem,
  ModuleItem,
} from './rolesTypes'

import type {
  RoleListItem,
  GetRolesArgs,
  CreateRoleRequest,
  RolePermissionItem,
  ModuleItem,
} from './rolesTypes'

export const rolesApi = createApi({
  reducerPath: 'rolesApi',
  baseQuery: coreBaseQuery,
  tagTypes: ['RoleList', 'Role', 'RolePermissions', 'ModuleList'],
  endpoints: (builder) => ({
    getRoles: builder.query<PagedResponse<RoleListItem>, GetRolesArgs>({
      query: ({ page, size, search, status, isSystem, sort }) => {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('size', String(size))
        if (search.trim()) params.set('search', search.trim())
        if (status) params.set('status', status)
        if (isSystem !== '') params.set('isSystem', String(isSystem))
        if (sort) params.set('sort', sort)
        return `/roles?${params.toString()}`
      },
      providesTags: [{ type: 'RoleList', id: 'LIST' }],
    }),
    getRole: builder.query<RoleListItem, string>({
      query: (roleId) => `/roles/${roleId}`,
      providesTags: (_result, _error, roleId) => [{ type: 'Role', id: roleId }],
    }),
    createRole: builder.mutation<RoleListItem, CreateRoleRequest>({
      query: (role) => ({
        url: '/roles',
        method: 'POST',
        body: role,
      }),
      invalidatesTags: (_, error) =>
        error ? [] : [{ type: 'RoleList', id: 'LIST' }],
    }),
    updateRole: builder.mutation<RoleListItem, CreateRoleRequest>({
      query: (role) => ({
        url: `/roles/${role.roleId}`,
        method: 'PUT',
        body: role,
      }),
      invalidatesTags: (_, error, role) =>
        error
          ? []
          : [
              { type: 'RoleList', id: 'LIST' },
              ...(role.roleId
                ? [{ type: 'Role' as const, id: role.roleId }]
                : []),
            ],
    }),
    deleteRole: builder.mutation<void, string>({
      query: (roleId) => ({
        url: `/roles/${roleId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_, error, roleId) =>
        error
          ? []
          : [
              { type: 'RoleList', id: 'LIST' },
              { type: 'Role', id: roleId },
            ],
    }),
    getRolePermissions: builder.query<RolePermissionItem[], string>({
      query: (roleId) => `/roles/${roleId}/permissions`,
      providesTags: (_result, _error, roleId) => [
        { type: 'RolePermissions', id: roleId },
      ],
    }),
    grantRolePermission: builder.mutation<
      RolePermissionItem,
      { roleId: string; permissionId: string }
    >({
      query: ({ roleId, permissionId }) => ({
        url: `/roles/${roleId}/permissions/${permissionId}`,
        method: 'POST',
      }),
      invalidatesTags: (_result, error, { roleId }) =>
        error
          ? []
          : [
              { type: 'RoleList', id: 'LIST' },
              { type: 'Role', id: roleId },
              { type: 'RolePermissions', id: roleId },
            ],
    }),
    revokeRolePermission: builder.mutation<
      void,
      { roleId: string; permissionId: string }
    >({
      query: ({ roleId, permissionId }) => ({
        url: `/roles/${roleId}/permissions/${permissionId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, error, { roleId }) =>
        error
          ? []
          : [
              { type: 'RoleList', id: 'LIST' },
              { type: 'Role', id: roleId },
              { type: 'RolePermissions', id: roleId },
            ],
    }),
    batchRolePermissions: builder.mutation<
      RolePermissionItem[],
      { roleId: string; permissionIds: string[]; revoke?: boolean }
    >({
      query: ({ roleId, permissionIds, revoke }) => ({
        url: `/roles/${roleId}/permissions/batch`,
        method: 'POST',
        body: { permissionIds, revoke },
      }),
      invalidatesTags: (_result, error, { roleId }) =>
        error
          ? []
          : [
              { type: 'RoleList', id: 'LIST' },
              { type: 'Role', id: roleId },
              { type: 'RolePermissions', id: roleId },
            ],
    }),
    getModules: builder.query<ModuleItem[], void>({
      query: () => '/modules',
      providesTags: [{ type: 'ModuleList', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetRolesQuery,
  useGetRoleQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useGetRolePermissionsQuery,
  useLazyGetRolePermissionsQuery,
  useGrantRolePermissionMutation,
  useRevokeRolePermissionMutation,
  useBatchRolePermissionsMutation,
  useGetModulesQuery,
} = rolesApi
