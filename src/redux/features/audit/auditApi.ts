import { createApi } from '@reduxjs/toolkit/query/react'
import { coreBaseQuery } from '../../baseQuery'
import type { PagedResponse } from '../../../lib/paging'
import type {
  AuditEvent,
  FailedLoginSummary,
  GetAuditArgs,
} from './auditTypes'

export type { AuditEvent, FailedLoginSummary, GetAuditArgs } from './auditTypes'

function auditQueryString(args: GetAuditArgs): string {
  const params = new URLSearchParams()
  params.set('page', String(args.page))
  params.set('size', String(args.size))
  if (args.search?.trim()) params.set('search', args.search.trim())
  if (args.sort) params.set('sort', args.sort)
  if (args.from) params.set('from', args.from)
  if (args.to) params.set('to', args.to)
  if (args.userId) params.set('userId', args.userId)
  if (args.actionType) params.set('actionType', args.actionType)
  if (args.entityType) params.set('entity', args.entityType)
  if (args.tenantId) params.set('tenantId', args.tenantId)
  if (args.ip) params.set('ip', args.ip)
  return params.toString()
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export const auditApi = createApi({
  reducerPath: 'auditApi',
  baseQuery: coreBaseQuery,
  tagTypes: ['AuditEvents', 'AuditEvent', 'FailedLoginSummary'],
  endpoints: (builder) => ({
    getAuditEvents: builder.query<PagedResponse<AuditEvent>, GetAuditArgs>({
      query: (args) => `/audit?${auditQueryString(args)}`,
      providesTags: [{ type: 'AuditEvents', id: 'LIST' }],
    }),
    getAuditEvent: builder.query<AuditEvent, string>({
      query: (auditId) => `/audit/${auditId}`,
      providesTags: (_result, _error, auditId) => [
        { type: 'AuditEvent', id: auditId },
      ],
    }),
    getFailedLoginSummary: builder.query<
      FailedLoginSummary,
      { from?: string; to?: string }
    >({
      query: ({ from, to }) => {
        const params = new URLSearchParams()
        if (from) params.set('from', from)
        if (to) params.set('to', to)
        const q = params.toString()
        return `/security/failed-login-summary${q ? `?${q}` : ''}`
      },
      providesTags: ['FailedLoginSummary'],
    }),
    exportAuditLogs: builder.mutation<boolean, GetAuditArgs>({
      queryFn: async (args, _api, _extraOptions, baseQuery) => {
        const result = await baseQuery({
          url: `/audit/export?${auditQueryString(args)}`,
          responseHandler: (response) => response.blob(),
        })
        if (result.error) {
          return { error: result.error }
        }
        const blob = result.data as Blob
        if (blob.type.includes('application/json')) {
          const text = await blob.text()
          try {
            const parsed = JSON.parse(text) as { message?: string }
            return {
              error: {
                status: 400,
                data: { message: parsed.message ?? 'Export failed' },
              },
            }
          } catch {
            return {
              error: {
                status: 400,
                data: { message: 'Export failed' },
              },
            }
          }
        }
        triggerDownload(blob, 'audit-logs.csv')
        return { data: true }
      },
    }),
  }),
})

export const {
  useGetAuditEventsQuery,
  useGetAuditEventQuery,
  useGetFailedLoginSummaryQuery,
  useExportAuditLogsMutation,
} = auditApi
