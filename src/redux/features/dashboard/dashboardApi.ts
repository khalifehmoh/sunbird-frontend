import { createApi } from '@reduxjs/toolkit/query/react'
import { coreBaseQuery } from '../../baseQuery'

export interface DashboardStats {
  tenantCount: number
  userCount: number
  activeSessionCount: number
  auditCount24h: number
  activityByDay: { date: string; count: number }[]
}

export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: coreBaseQuery,
  tagTypes: ['DashboardStats'],
  endpoints: (builder) => ({
    getDashboardStats: builder.query<DashboardStats, void>({
      query: () => '/dashboard/stats',
      providesTags: ['DashboardStats'],
    }),
  }),
})

export const { useGetDashboardStatsQuery } = dashboardApi
