import { createApi } from '@reduxjs/toolkit/query/react'
import { coreBaseQuery } from '../../baseQuery'
import type { PagedResponse } from '../../../lib/paging'
import type {
  CreateModuleRequest,
  CreatePermissionRequest,
  GetModulesArgs,
  GetPermissionsArgs,
  ModuleCatalogItem,
  ModuleListItem,
  PermissionListItem,
} from './modulesTypes'

export const modulesApi = createApi({
  reducerPath: 'modulesApi',
  baseQuery: coreBaseQuery,
  tagTypes: [
    'ModuleList',
    'Module',
    'ModuleCatalog',
    'PermissionList',
    'Permission',
  ],
  endpoints: (builder) => ({
    getModuleCatalog: builder.query<ModuleCatalogItem[], void>({
      query: () => '/modules',
      providesTags: [{ type: 'ModuleCatalog', id: 'LIST' }],
    }),
    getModules: builder.query<PagedResponse<ModuleListItem>, GetModulesArgs>({
      query: ({ page, size, search, status, sort }) => {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('size', String(size))
        if (search.trim()) params.set('search', search.trim())
        if (status) params.set('status', status)
        if (sort) params.set('sort', sort)
        return `/modules?${params.toString()}`
      },
      providesTags: [{ type: 'ModuleList', id: 'LIST' }],
    }),
    getModule: builder.query<ModuleListItem, string>({
      query: (moduleId) => `/modules/${moduleId}`,
      providesTags: (_result, _error, moduleId) => [
        { type: 'Module', id: moduleId },
      ],
    }),
    createModule: builder.mutation<ModuleListItem, CreateModuleRequest>({
      query: (module) => ({
        url: '/modules',
        method: 'POST',
        body: module,
      }),
      invalidatesTags: (_, error) =>
        error
          ? []
          : [
              { type: 'ModuleList', id: 'LIST' },
              { type: 'ModuleCatalog', id: 'LIST' },
            ],
    }),
    updateModule: builder.mutation<ModuleListItem, CreateModuleRequest>({
      query: (module) => ({
        url: `/modules/${module.moduleId}`,
        method: 'PUT',
        body: module,
      }),
      invalidatesTags: (_, error, module) =>
        error
          ? []
          : [
              { type: 'ModuleList', id: 'LIST' },
              { type: 'ModuleCatalog', id: 'LIST' },
              ...(module.moduleId
                ? [{ type: 'Module' as const, id: module.moduleId }]
                : []),
            ],
    }),
    deleteModule: builder.mutation<void, string>({
      query: (moduleId) => ({
        url: `/modules/${moduleId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_, error, moduleId) =>
        error
          ? []
          : [
              { type: 'ModuleList', id: 'LIST' },
              { type: 'ModuleCatalog', id: 'LIST' },
              { type: 'Module', id: moduleId },
              { type: 'PermissionList', id: 'LIST' },
            ],
    }),
    getPermissions: builder.query<
      PagedResponse<PermissionListItem>,
      GetPermissionsArgs
    >({
      query: ({ page, size, moduleId, operation, sort }) => {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('size', String(size))
        if (moduleId) params.set('moduleId', moduleId)
        if (operation) params.set('operation', operation)
        if (sort) params.set('sort', sort)
        return `/permissions?${params.toString()}`
      },
      providesTags: [{ type: 'PermissionList', id: 'LIST' }],
    }),
    getPermission: builder.query<PermissionListItem, string>({
      query: (permissionId) => `/permissions/${permissionId}`,
      providesTags: (_result, _error, permissionId) => [
        { type: 'Permission', id: permissionId },
      ],
    }),
    createPermission: builder.mutation<
      PermissionListItem,
      CreatePermissionRequest
    >({
      query: (permission) => ({
        url: '/permissions',
        method: 'POST',
        body: permission,
      }),
      invalidatesTags: (_, error) =>
        error
          ? []
          : [
              { type: 'PermissionList', id: 'LIST' },
              { type: 'ModuleList', id: 'LIST' },
              { type: 'ModuleCatalog', id: 'LIST' },
            ],
    }),
    updatePermission: builder.mutation<
      PermissionListItem,
      CreatePermissionRequest
    >({
      query: (permission) => ({
        url: `/permissions/${permission.permissionId}`,
        method: 'PUT',
        body: permission,
      }),
      invalidatesTags: (_, error, permission) =>
        error
          ? []
          : [
              { type: 'PermissionList', id: 'LIST' },
              { type: 'ModuleList', id: 'LIST' },
              { type: 'ModuleCatalog', id: 'LIST' },
              ...(permission.permissionId
                ? [{ type: 'Permission' as const, id: permission.permissionId }]
                : []),
            ],
    }),
    deletePermission: builder.mutation<void, string>({
      query: (permissionId) => ({
        url: `/permissions/${permissionId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_, error, permissionId) =>
        error
          ? []
          : [
              { type: 'PermissionList', id: 'LIST' },
              { type: 'Permission', id: permissionId },
              { type: 'ModuleList', id: 'LIST' },
              { type: 'ModuleCatalog', id: 'LIST' },
            ],
    }),
  }),
})

export const {
  useGetModuleCatalogQuery,
  useGetModulesQuery,
  useGetModuleQuery,
  useCreateModuleMutation,
  useUpdateModuleMutation,
  useDeleteModuleMutation,
  useGetPermissionsQuery,
  useGetPermissionQuery,
  useCreatePermissionMutation,
  useUpdatePermissionMutation,
  useDeletePermissionMutation,
} = modulesApi
