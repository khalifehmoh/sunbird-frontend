import { createApi } from '@reduxjs/toolkit/query/react'
import { coreBaseQuery } from '../../baseQuery'

export type DemoSms = {
  provider: 'demo'
  to: string
  body: string
  sentAt: string
}

export type DischargeNotificationItem = {
  path: string | undefined
  id: string | undefined
  sent: string | undefined
}

export type DischargeNotificationsResponse = {
  encounterId: string
  bot: boolean
  bullmq: boolean
  items: DischargeNotificationItem[]
  sms?: DemoSms
  communications?: unknown[]
}

/**
 * Event-driven spike read API — Bot vs BullMQ discharge Communications.
 */
export const eventsApi = createApi({
  reducerPath: 'eventsApi',
  baseQuery: coreBaseQuery,
  tagTypes: ['DischargeNotifications'],
  endpoints: (builder) => ({
    getDischargeNotifications: builder.query<
      DischargeNotificationsResponse,
      string
    >({
      query: (encounterId) => `/events/notifications/${encounterId}`,
      providesTags: (_r, _e, encounterId) => [
        { type: 'DischargeNotifications', id: encounterId },
      ],
    }),
  }),
})

export const { useGetDischargeNotificationsQuery } = eventsApi
