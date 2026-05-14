import { createApi } from '@reduxjs/toolkit/query/react'
import { coreBaseQuery } from '../../baseQuery'

export type OrganizationType =
  | 'HOSPITAL'
  | 'NETWORK'
  | 'CLINIC'
  | 'LAB'
  | 'PHARMACY'

export type TenantStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING'

/** Matches GET /tenants list payload */
export interface TenantListItem {
  tenantId?: string
  tenantCode: string
  tenantName?: string
  tenantNameAr: string | null
  organizationType: OrganizationType
  licenseNumber: string | null
  status: TenantStatus
  maxUsers: number
  createdAt: string | null
  updatedAt: string | null
}

export interface TenantsPageResponse {
  content: TenantListItem[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}

export interface GetTenantsArgs {
  page: number
  size: number
  search: string
  status: TenantStatus | ''
  type: OrganizationType | ''
  sort?: string
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
      providesTags: [{ type: 'TenantList', id: 'LIST' }],
    }),
    // patchTenantStatus: builder.mutation<
    //   unknown,
    //   { tenantId: string; status: TenantStatus }
    // >({
    //   query: ({ tenantId, status }) => ({
    //     url: `/tenants/${tenantId}/status`,
    //     method: 'PATCH',
    //     body: { status },
    //   }),
    //   invalidatesTags: [{ type: 'TenantList', id: 'LIST' }],
    // }),
    // deleteTenant: builder.mutation<void, string>({
    //   query: (tenantId) => ({
    //     url: `/tenants/${tenantId}`,
    //     method: 'DELETE',
    //   }),
    //   invalidatesTags: [{ type: 'TenantList', id: 'LIST' }],
    // }),
  }),
})

export const {
  useGetTenantsQuery,
  // usePatchTenantStatusMutation,
  // useDeleteTenantMutation,
} = tenantsApi
