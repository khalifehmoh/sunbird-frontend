import { createApi } from '@reduxjs/toolkit/query/react'
import { coreBaseQuery } from '../../baseQuery'

export type EncounterResponse = {
  id: string
  visitNumber: string | null
  status: string
  patientClass: string
  patientId: string | null
  patientDisplay: string | null
  locationId: string | null
  locationDisplay: string | null
  attendingDisplay: string | null
  periodStart: string | null
  periodEnd: string | null
  lengthOfStayDays: number | null
  lastAdtEvent: string | null
  lastUpdated: string | null
}

export type LocationNode = {
  id: string
  name: string
  code: string | null
  physicalType: string
  status: string | null
  operationalStatus: string | null
  partOfId: string | null
  occupiedByEncounterId: string | null
}

export type AdmitRequest = {
  patientId: string
  visitNumber?: string
  admitType: string
  admitSource?: string
  bedLocationId: string
  attendingPractitionerId?: string
  primaryDiagnosisCode?: string
  primaryDiagnosisDisplay?: string
  hospitalService?: string
  admitDateTime?: string
}

export type RegisterVisitRequest = {
  patientId: string
  patientClass: 'AMB' | 'EMER'
  visitNumber?: string
  locationId?: string
  attendingPractitionerId?: string
  registrationDateTime?: string
  visitReason?: string
  triageCategory?: string
  arrivalMode?: string
}

export type TransferRequest = {
  encounterId: string
  bedLocationId: string
  transferReason: string
  attendingPractitionerId?: string
  transferDateTime?: string
}

export type DischargeRequest = {
  encounterId: string
  dischargeDateTime: string
  dischargeDisposition: string
  dischargeCondition: string
  attendingPractitionerId?: string
  dischargeDiagnosisCode?: string
  dischargeDiagnosisDisplay?: string
}

export type PreadmitRequest = {
  patientId: string
  visitNumber?: string
  plannedStartDate: string
  wardLocationId?: string
  plannedProcedure?: string
  attendingPractitionerId?: string
  status?: string
}

export const adtApi = createApi({
  reducerPath: 'adtApi',
  baseQuery: coreBaseQuery,
  tagTypes: ['AdtEncounter', 'BedBoard'],
  endpoints: (builder) => ({
    admitPatient: builder.mutation<EncounterResponse, AdmitRequest>({
      query: (body) => ({ url: '/adt/admit', method: 'POST', body }),
      invalidatesTags: ['AdtEncounter', 'BedBoard'],
    }),
    registerVisit: builder.mutation<EncounterResponse, RegisterVisitRequest>({
      query: (body) => ({ url: '/adt/register', method: 'POST', body }),
      invalidatesTags: ['AdtEncounter'],
    }),
    transferPatient: builder.mutation<EncounterResponse, TransferRequest>({
      query: (body) => ({ url: '/adt/transfer', method: 'POST', body }),
      invalidatesTags: ['AdtEncounter', 'BedBoard'],
    }),
    dischargePatient: builder.mutation<EncounterResponse, DischargeRequest>({
      query: (body) => ({ url: '/adt/discharge', method: 'POST', body }),
      invalidatesTags: ['AdtEncounter', 'BedBoard'],
    }),
    preadmitPatient: builder.mutation<EncounterResponse, PreadmitRequest>({
      query: (body) => ({ url: '/adt/preadmit', method: 'POST', body }),
      invalidatesTags: ['AdtEncounter'],
    }),
    getAdtEncounter: builder.query<EncounterResponse, string>({
      query: (id) => `/adt/encounters/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'AdtEncounter', id }],
    }),
    getBedBoard: builder.query<{ locations: LocationNode[] }, void>({
      query: () => '/adt/beds',
      providesTags: ['BedBoard'],
    }),
  }),
})

export const {
  useAdmitPatientMutation,
  useRegisterVisitMutation,
  useTransferPatientMutation,
  useDischargePatientMutation,
  usePreadmitPatientMutation,
  useGetAdtEncounterQuery,
  useGetBedBoardQuery,
} = adtApi
