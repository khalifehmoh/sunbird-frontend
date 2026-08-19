import { createApi } from '@reduxjs/toolkit/query/react'
import { coreBaseQuery } from '../../baseQuery'
import type { PagedResponse } from '../../../lib/paging'
export type {
  OrganizationType,
  TenantStatus,
  TenantListItem,
  GetTenantsArgs,
  CreateTenantRequest,
  TenantConfigItem,
  TenantAuditResponse,
} from './tenantsTypes'

import type {
  TenantListItem,
  GetTenantsArgs,
  CreateTenantRequest,
  TenantConfigItem,
  TenantAuditResponse,
  TenantStatus,
} from './tenantsTypes'

function toTenantsPageResponse(
  response: TenantListItem[] | PagedResponse<TenantListItem>,
  args: GetTenantsArgs,
): PagedResponse<TenantListItem> {
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
  tagTypes: ['TenantList', 'Tenant', 'TenantConfig', 'TenantAudit'],
  endpoints: (builder) => ({
    getTenants: builder.query<PagedResponse<TenantListItem>, GetTenantsArgs>({
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
          response as TenantListItem[] | PagedResponse<TenantListItem>,
          arg,
        ),
      providesTags: [{ type: 'TenantList', id: 'LIST' }],
    }),
    getTenant: builder.query<TenantListItem, string>({
      query: (tenantId) => `/tenants/${tenantId}`,
      providesTags: (_result, _error, tenantId) => [
        { type: 'Tenant', id: tenantId },
      ],
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
      invalidatesTags: (_, error, tenant) =>
        error
          ? []
          : [
              { type: 'TenantList', id: 'LIST' },
              ...(tenant.tenantId
                ? [{ type: 'Tenant' as const, id: tenant.tenantId }]
                : []),
            ],
    }),
    deleteTenant: builder.mutation<void, string>({
      query: (tenantId) => ({
        url: `/tenants/${tenantId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_, error, tenantId) =>
        error
          ? []
          : [
              { type: 'TenantList', id: 'LIST' },
              { type: 'Tenant', id: tenantId },
            ],
    }),
    patchTenantStatus: builder.mutation<
      TenantListItem,
      { tenantId: string; status: TenantStatus }
    >({
      query: ({ tenantId, status }) => ({
        url: `/tenants/${tenantId}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_result, error, { tenantId }) =>
        error
          ? []
          : [
              { type: 'TenantList', id: 'LIST' },
              { type: 'Tenant', id: tenantId },
            ],
    }),
    getTenantConfig: builder.query<TenantConfigItem[], string>({
      query: (tenantId) => `/tenants/${tenantId}/config`,
      providesTags: (_result, _error, tenantId) => [
        { type: 'TenantConfig', id: tenantId },
      ],
    }),
    updateTenantConfig: builder.mutation<
      TenantConfigItem,
      { tenantId: string; key: string; value: unknown }
    >({
      query: ({ tenantId, key, value }) => ({
        url: `/tenants/${tenantId}/config/${encodeURIComponent(key)}`,
        method: 'PUT',
        body: { configValue: value },
      }),
      invalidatesTags: (_result, error, { tenantId }) =>
        error ? [] : [{ type: 'TenantConfig', id: tenantId }],
    }),
    getTenantAudit: builder.query<TenantAuditResponse, string>({
      query: (tenantId) => `/audit?tenantId=${tenantId}&limit=50`,
      providesTags: (_result, _error, tenantId) => [
        { type: 'TenantAudit', id: tenantId },
      ],
    }),
  }),
})

export const {
  useGetTenantsQuery,
  useGetTenantQuery,
  useCreateTenantMutation,
  useUpdateTenantMutation,
  useDeleteTenantMutation,
  usePatchTenantStatusMutation,
  useGetTenantConfigQuery,
  useUpdateTenantConfigMutation,
  useGetTenantAuditQuery,
} = tenantsApi
