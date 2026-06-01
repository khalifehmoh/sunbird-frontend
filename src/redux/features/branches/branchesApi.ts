import { createApi } from '@reduxjs/toolkit/query/react'
import { coreBaseQuery } from '../../baseQuery'
export type {
  BranchType,
  BranchStatus,
  BranchListItem,
  BranchesPageResponse,
  GetBranchesArgs,
  CreateBranchRequest,
} from './branchesTypes'

import type {
  BranchListItem,
  BranchesPageResponse,
  GetBranchesArgs,
  CreateBranchRequest,
} from './branchesTypes'

export const branchesApi = createApi({
  reducerPath: 'branchesApi',
  baseQuery: coreBaseQuery,
  tagTypes: ['BranchList'],
  endpoints: (builder) => ({
    getBranches: builder.query<BranchesPageResponse, GetBranchesArgs>({
      query: ({ page, size, search, tenantId, status, type, hqOnly, sort }) => {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('size', String(size))
        if (search.trim()) params.set('search', search.trim())
        if (tenantId) params.set('tenantId', tenantId)
        if (status) params.set('status', status)
        if (type) params.set('type', type)
        if (hqOnly) params.set('hqOnly', 'true')
        if (sort) params.set('sort', sort)
        const q = params.toString()
        return `/branches${q ? `?${q}` : ''}`
      },
      providesTags: [{ type: 'BranchList', id: 'LIST' }],
    }),
    getBranch: builder.query<BranchListItem, string>({
      query: (branchId) => `/branches/${branchId}`,
      providesTags: [{ type: 'BranchList', id: 'LIST' }],
    }),
    createBranch: builder.mutation<BranchListItem, CreateBranchRequest>({
      query: (branch) => ({
        url: '/branches',
        method: 'POST',
        body: branch,
      }),
      invalidatesTags: (_, error) =>
        error ? [] : [{ type: 'BranchList', id: 'LIST' }],
    }),
    updateBranch: builder.mutation<BranchListItem, CreateBranchRequest>({
      query: (branch) => ({
        url: `/branches/${branch.branchId}`,
        method: 'PUT',
        body: branch,
      }),
      invalidatesTags: (_, error) =>
        error ? [] : [{ type: 'BranchList', id: 'LIST' }],
    }),
    deleteBranch: builder.mutation<void, string>({
      query: (branchId) => ({
        url: `/branches/${branchId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_, error) =>
        error ? [] : [{ type: 'BranchList', id: 'LIST' }],
    }),
    patchBranchStatus: builder.mutation<
      BranchListItem,
      { branchId: string; status: 'ACTIVE' | 'INACTIVE' }
    >({
      query: ({ branchId, status }) => ({
        url: `/branches/${branchId}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_, error) =>
        error ? [] : [{ type: 'BranchList', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetBranchesQuery,
  useGetBranchQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useDeleteBranchMutation,
  usePatchBranchStatusMutation,
} = branchesApi
