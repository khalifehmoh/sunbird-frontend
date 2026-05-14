import { createApi } from '@reduxjs/toolkit/query/react'
import { coreBaseQuery } from '../../baseQuery'

export interface DashboardStats {
  tenantCount: number
  userCount: number
  activeSessionCount: number
  auditCount24h: number
  activityByDay: { date: string; count: number }[]
}

export interface AuditEvent {
  id: string
  createdAt: string
  username: string | null
  actionType: string
  entityType: string
  entityName: string
  success: boolean
  ipAddress?: string
}

export interface AuditEventsResponse {
  content: AuditEvent[]
  totalElements: number
  totalPages: number
  page: number
}

export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: coreBaseQuery,
  tagTypes: ['DashboardStats', 'AuditEvents'],
  endpoints: (builder) => ({
    getDashboardStats: builder.query<DashboardStats, void>({
      query: () => '/dashboard/stats',
      providesTags: ['DashboardStats'],
    }),
    getRecentAuditEvents: builder.query<AuditEventsResponse, void>({
      query: () => '/audit?limit=10&sort=created_at:desc',
      providesTags: ['AuditEvents'],
    }),
  }),
})

export const { useGetDashboardStatsQuery, useGetRecentAuditEventsQuery } =
  dashboardApi
