import { createApi } from '@reduxjs/toolkit/query/react'
import { coreBaseQuery } from '../../baseQuery'
export type {
  OrganizationType,
  TenantStatus,
  TenantListItem,
  TenantsPageResponse,
  GetTenantsArgs,
  CreateTenantRequest,
} from './tenantsTypes'

import type {
  TenantListItem,
  TenantsPageResponse,
  GetTenantsArgs,
  CreateTenantRequest,
} from './tenantsTypes'

function toTenantsPageResponse(
  response: TenantListItem[] | TenantsPageResponse,
  args: GetTenantsArgs,
): TenantsPageResponse {
  if (!Array.isArray(response)) {
    return response
  }

  const totalElements = response.length
  const totalPages = Math.max(1, Math.ceil(totalElements / args.size))
  const start = args.page * args.size

  return {
    content: response.slice(start, start + args.size),
    totalElements,
    totalPages,
    page: args.page,
    size: args.size,
  }
}

export const tenantsApi = createApi({
  reducerPath: 'tenantsApi',
  baseQuery: coreBaseQuery,
  tagTypes: ['TenantList'],
  endpoints: (builder) => ({
    getTenants: builder.query<TenantsPageResponse, GetTenantsArgs>({
      query: ({ page, size, search, status, type, sort }) => {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('size', String(size))
        if (search.trim()) params.set('search', search.trim())
        if (status) params.set('status', status)
        if (type) params.set('type', type)
        if (sort) params.set('sort', sort)
        const q = params.toString()
        return `/tenants${q ? `?${q}` : ''}`
      },
      transformResponse: (response, _meta, arg) =>
        toTenantsPageResponse(
          response as TenantListItem[] | TenantsPageResponse,
          arg,
        ),
      providesTags: [{ type: 'TenantList', id: 'LIST' }],
    }),
    getTenant: builder.query<TenantListItem, string>({
      query: (tenantId) => `/tenants/${tenantId}`,
      providesTags: [{ type: 'TenantList', id: 'LIST' }],
    }),
    createTenant: builder.mutation<TenantListItem, CreateTenantRequest>({
      query: (tenant) => ({
        url: '/tenants',
        method: 'POST',
        body: tenant,
      }),
      invalidatesTags: (_, error) =>
        error ? [] : [{ type: 'TenantList', id: 'LIST' }],
    }),
    updateTenant: builder.mutation<TenantListItem, CreateTenantRequest>({
      query: (tenant) => ({
        url: `/tenants/${tenant.tenantId}`,
        method: 'PUT',
        body: tenant,
      }),
      invalidatesTags: (_, error) =>
        error ? [] : [{ type: 'TenantList', id: 'LIST' }],
    }),
    deleteTenant: builder.mutation<void, string>({
      query: (tenantId) => ({
        url: `/tenants/${tenantId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_, error) =>
        error ? [] : [{ type: 'TenantList', id: 'LIST' }],
    })
  }),
})

export const {
  useGetTenantsQuery,
  useGetTenantQuery,
  useCreateTenantMutation,
  useUpdateTenantMutation,
  useDeleteTenantMutation,
} = tenantsApi
