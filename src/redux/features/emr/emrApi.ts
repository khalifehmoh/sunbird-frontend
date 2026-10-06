import { createApi } from '@reduxjs/toolkit/query/react'
import { coreBaseQuery } from '../../baseQuery'
import type { EncounterResponse } from '../adt/adtApi'

// ---------------------------------------------------------------- shared

export type DateRangeParams = { from?: string; to?: string; limit?: number }
export type PatientScopedParams = DateRangeParams & {
  patientId?: string
  encounterId?: string
}

export type OrderType = 'LAB' | 'RAD'
export type OrderPriority = 'ROUTINE' | 'URGENT' | 'STAT'

// ------------------------------------------------------------- dashboard

export type CriticalFlag = 'critical' | 'abnormal' | 'normal' | 'unrated'

export type ObservationRow = {
  id: string
  code: string | null
  display: string | null
  value: string | null
  numericValue: number | null
  unit: string | null
  referenceRange: string | null
  interpretation: string | null
  flag: CriticalFlag
  status: string
  corrected: boolean
  observedAt: string | null
}

export type CriticalAlert = ObservationRow & {
  patientId: string | null
  patientName: string | null
  mrn: string | null
  reportId: string | null
}

export type DayActivity = {
  date: string
  admissions: number
  discharges: number
  opdVisits: number
}

export type DashboardSummary = {
  generatedAt: string
  date: string
  kpis: {
    activeInpatients: number
    opdVisitsToday: number
    admissionsToday: number
    dischargesToday: number
    appointmentsToday: number
    pendingOrders: number
    criticalResultsToday: number
    vitalsRecordedToday: number
  }
  activity: DayActivity[]
  criticalAlerts: CriticalAlert[]
  truncated: boolean
}

export type RegistrationDashboard = {
  date: string
  kpis: {
    opdVisits: number
    admissions: number
    discharges: number
    appointments: number
    cancellations: number
    noShows: number
  }
  events: {
    at: string
    event: string
    description: string
    patientId: string | null
    patientName: string | null
    mrn: string | null
  }[]
  truncated: boolean
}

export type ClinicalDashboard = {
  date: string
  kpis: {
    activeInpatients: number
    ordersToday: number
    pendingOrders: number
    criticalResultsToday: number
    averageLengthOfStayDays: number | null
    vitalsRecordedToday: number
  }
  inpatientsByWard: { ward: string; count: number }[]
}

export type IntegrationKpis = {
  windowStart: string
  windowEnd: string
  received: number
  processed: number
  failed: number
  failureRatePercent: number
}

export type IntegrationDashboard = IntegrationKpis & {
  byType: { messageType: string; count: number; failed: number }[]
  recentErrors: {
    messageId: string
    stage: string
    code: string
    message: string
    at: string
  }[]
}

// -------------------------------------------------------------- patients

export type WorklistFilter = 'all' | 'inpatient' | 'opd' | 'ed' | 'critical'

export type WorklistItem = {
  id: string
  mrn: string | null
  name: string
  nameAr: string | null
  gender: string | null
  birthDate: string | null
  ageYears: number | null
  mobile: string | null
  patientClass: string | null
  encounterId: string | null
  visitNumber: string | null
  ward: string | null
  location: string | null
  lastActivity: string | null
  critical: boolean
  hasAllergy: boolean
}

export type WorklistResult = {
  items: WorklistItem[]
  counts: Record<WorklistFilter, number>
}

export type RegisterPatientRequest = {
  firstName: string
  lastName: string
  firstNameAr?: string
  lastNameAr?: string
  gender: 'male' | 'female' | 'other' | 'unknown'
  birthDate: string
  nationalId?: string
  mobile?: string
  email?: string
  preferredLanguage?: 'en' | 'ar'
  emergencyContact?: { name: string; relationship?: string; phone: string }
}

export type RegisteredPatient = {
  id: string
  mrn: string
  name: string
  nameAr: string | null
  entrySource: 'MANUAL'
}

export type DiagnosisType =
  | 'PRIMARY'
  | 'SECONDARY'
  | 'ADMITTING'
  | 'WORKING'
  | 'DISCHARGE'

export type DiagnosisRow = {
  id: string
  patientId: string | null
  encounterId: string | null
  type: DiagnosisType | null
  code: string | null
  display: string | null
  verification: string | null
  notes: string | null
  recordedAt: string | null
}

export type VitalRow = {
  id: string
  patientId: string | null
  encounterId: string | null
  code: string
  loinc: string
  display: string
  value: number
  unit: string
  interpretation: string | null
  flag: CriticalFlag
  measuredAt: string | null
  source: string
}

export type VitalsResponse = {
  items: VitalRow[]
  summary: { total: number; critical: number; abnormal: number }
}

export type AppointmentRow = {
  id: string
  status: string
  start: string | null
  end: string | null
  durationMinutes: number | null
  type: string | null
  reason: string | null
  patientId: string | null
  patientName: string | null
  mrn: string | null
  practitionerId: string | null
  practitionerName: string | null
  cancellationReason: string | null
  createdAt: string | null
}

export type ActivityItem = {
  type: 'encounter' | 'order' | 'result' | 'vitals' | 'diagnosis' | 'appointment'
  id: string
  at: string
  title: string
  detail: string | null
}

export type PatientOverview = {
  patient: {
    id: string
    mrn: string | null
    name: string
    nameAr: string | null
    gender: string | null
    birthDate: string | null
    ageYears: number | null
    mobile: string | null
    email: string | null
    nationalId: string | null
    preferredLanguage: 'en' | 'ar'
    emergencyContact: {
      name: string
      relationship: string | null
      phone: string | null
    } | null
    allergies: string[]
    lastUpdated: string | null
  }
  activeEncounter: EncounterResponse | null
  ward: string | null
  diagnoses: DiagnosisRow[]
  latestVitals: VitalRow[]
  upcomingAppointments: AppointmentRow[]
  recentActivity: ActivityItem[]
  counts: {
    encounters: number
    orders: number
    results: number
    vitals: number
    diagnoses: number
    appointments: number
  }
}

export type FieldChange = {
  path: string
  before: string | null
  after: string | null
}

export type AuditVersion = {
  versionId: string
  lastUpdated: string | null
  author: string | null
  kind: 'created' | 'updated'
  changes: FieldChange[]
}

export type PatientAudit = {
  patient: { id: string; mrn: string | null; name: string }
  versions: AuditVersion[]
}

// ---------------------------------------------------------------- orders

export type CatalogEntry = { code: string; display: string; type: OrderType }

export type OrderRow = {
  id: string
  orderNumber: string | null
  type: OrderType | null
  code: string | null
  display: string | null
  priority: OrderPriority
  status: string
  patientId: string | null
  patientName: string | null
  mrn: string | null
  encounterId: string | null
  orderedAt: string | null
  notes: string | null
}

export type CreateOrderRequest = {
  patientId: string
  encounterId?: string
  type: OrderType
  code: string
  display?: string
  priority?: OrderPriority
  notes?: string
}

export type OrdersParams = PatientScopedParams & {
  status?: string
  type?: OrderType
  priority?: OrderPriority
}

// --------------------------------------------------------------- results

export type ResultRow = {
  id: string
  controlId: string | null
  orderNumber: string | null
  type: string | null
  code: string | null
  display: string | null
  status: string
  hasCritical: boolean
  patientId: string | null
  patientName: string | null
  mrn: string | null
  encounterId: string | null
  issuedAt: string | null
  conclusion: string | null
  source: string
}

export type ResultDetail = ResultRow & { observations: ObservationRow[] }

export type ResultsParams = PatientScopedParams & {
  status?: string
  criticalOnly?: boolean
}

// ---------------------------------------------------------- appointments

export type AppointmentType =
  | 'ROUTINE'
  | 'CHECKUP'
  | 'FOLLOWUP'
  | 'WALKIN'
  | 'EMERGENCY'

export type Clinic = {
  slotMinutes: number
  dayStartHour: number
  dayEndHour: number
  utcOffsetMinutes: number
  workingDays: number[]
}

export type Provider = { id: string; name: string }

export type SlotStatus = 'free' | 'booked' | 'blocked'
export type DaySlots = {
  date: string
  working: boolean
  slots: { start: string; end: string; status: SlotStatus }[]
}

export type AppointmentsParams = {
  patientId?: string
  practitionerId?: string
  status?: string
  from?: string
  to?: string
  limit?: number
}

export type BookAppointmentRequest = {
  patientId: string
  practitionerId: string
  start: string
  durationMinutes?: number
  type?: AppointmentType
  reason?: string
}

// ---------------------------------------------------------------- vitals

export type VitalDefinition = {
  key: string
  loinc: string
  display: string
  displayAr: string
  unit: string
  normal: { low?: number; high?: number } | null
  critical: { low?: number; high?: number } | null
  plausible: { low: number; high: number }
}

export type RecordVitalsRequest = {
  patientId: string
  encounterId?: string
  measuredAt?: string
  source?: 'MANUAL' | 'DEVICE'
  readings: { code: string; value: number }[]
  note?: string
}

export type CreateDiagnosisRequest = {
  patientId: string
  encounterId: string
  type: DiagnosisType
  code: string
  display: string
  notes?: string
}

// ----------------------------------------------------------- integration

export type MessageStatus = 'RECEIVED' | 'PROCESSED' | 'FAILED'

export type IntegrationMessage = {
  id: string
  controlId: string | null
  messageType: string | null
  source: string
  sendingApplication: string | null
  status: MessageStatus
  attempts: number
  receivedAt: string
  processedAt: string | null
  lastError: { code: string; message: string; stage: string } | null
}

export type IntegrationMessageDetail = Omit<IntegrationMessage, 'lastError'> & {
  rawMessage: string
  stages: {
    seq: number
    stage: string
    status: string
    detail: string | null
    at: string
  }[]
  errors: { stage: string; code: string; message: string; at: string }[]
  acks: { code: string; raw: string; at: string }[]
  retries: {
    requestedBy: string | null
    reason: string | null
    outcome: string | null
    at: string
  }[]
}

export type IntegrationMessagesParams = {
  status?: MessageStatus
  messageType?: string
  q?: string
  from?: string
  to?: string
  limit?: number
}

export type IngestOutcome = {
  messageId: string
  status: 'PROCESSED' | 'FAILED'
  ackCode: 'AA' | 'AE' | 'AR'
  ack: string
  detail: string
}

// --------------------------------------------------------- notifications

export type NotificationChannel = 'SMS' | 'WHATSAPP' | 'EMAIL'
export type NotificationLanguage = 'en' | 'ar'
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED'

export type NotificationLogRow = {
  id: string
  eventCode: string
  channel: string
  language: string
  recipient: string | null
  patientId: string | null
  body: string
  status: string
  provider: string | null
  error: string | null
  createdAt: string
  sentAt: string | null
}

export type NotificationLogParams = DateRangeParams & {
  status?: NotificationStatus
  channel?: NotificationChannel
  eventCode?: string
  patientId?: string
}

export type NotificationEvent = {
  code: string
  label: string
  placeholders: string[]
}

export type TemplateRow = {
  id: string
  eventCode: string
  eventLabel: string
  language: string
  channel: string
  subject: string | null
  body: string
  isActive: boolean
  placeholders: string[]
  updatedAt: string
}

export type CreateTemplateRequest = {
  eventCode: string
  language: NotificationLanguage
  channel: NotificationChannel
  subject?: string
  body: string
}

export type UpdateTemplateRequest = {
  id: string
  subject?: string
  body?: string
  isActive?: boolean
}

export type TemplatePreview = {
  text: string
  missing: string[]
  unknown: string[]
}

// -------------------------------------------------------- capability stmt

export type CapabilityResource = {
  type: string
  interaction: { code: string }[]
  searchParam?: { name: string; type: string }[]
}

export type CapabilityStatement = {
  resourceType: 'CapabilityStatement'
  status?: string
  date?: string
  fhirVersion?: string
  software?: { name?: string; version?: string }
  format?: string[]
  rest?: { mode: string; resource?: CapabilityResource[] }[]
}

// ------------------------------------------------------------------- api

export const emrApi = createApi({
  reducerPath: 'emrApi',
  baseQuery: coreBaseQuery,
  tagTypes: [
    'Worklist',
    'Overview',
    'Order',
    'Result',
    'Appointment',
    'Vitals',
    'Diagnosis',
    'Message',
    'Template',
    'Dashboard',
  ],
  endpoints: (builder) => ({
    // dashboards
    getDashboardSummary: builder.query<DashboardSummary, void>({
      query: () => '/emr/dashboard/summary',
      providesTags: ['Dashboard'],
    }),
    getRegistrationDashboard: builder.query<RegistrationDashboard, void>({
      query: () => '/emr/dashboard/registration',
      providesTags: ['Dashboard'],
    }),
    getClinicalDashboard: builder.query<ClinicalDashboard, void>({
      query: () => '/emr/dashboard/clinical',
      providesTags: ['Dashboard'],
    }),
    getIntegrationDashboard: builder.query<IntegrationDashboard, void>({
      query: () => '/emr/dashboard/integration',
      providesTags: ['Dashboard', 'Message'],
    }),

    // patients
    getWorklist: builder.query<
      WorklistResult,
      { q?: string; filter?: WorklistFilter; limit?: number }
    >({
      query: (params) => ({ url: '/emr/patients', params }),
      providesTags: ['Worklist'],
    }),
    getPatientOverview: builder.query<PatientOverview, string>({
      query: (id) => `/emr/patients/${id}/overview`,
      providesTags: (_r, _e, id) => [{ type: 'Overview', id }],
    }),
    getPatientEncounters: builder.query<{ items: EncounterResponse[] }, string>({
      query: (id) => `/emr/patients/${id}/encounters`,
      providesTags: (_r, _e, id) => [{ type: 'Overview', id }],
    }),
    getPatientAudit: builder.query<PatientAudit, string>({
      query: (id) => `/emr/patients/${id}/audit`,
    }),
    registerPatient: builder.mutation<RegisteredPatient, RegisterPatientRequest>({
      query: (body) => ({ url: '/emr/patients', method: 'POST', body }),
      invalidatesTags: ['Worklist', 'Dashboard'],
    }),

    // orders
    getOrderCatalog: builder.query<
      { items: CatalogEntry[] },
      { type?: OrderType; q?: string }
    >({
      query: (params) => ({ url: '/emr/orders/catalog', params }),
    }),
    getOrders: builder.query<{ items: OrderRow[] }, OrdersParams>({
      query: (params) => ({ url: '/emr/orders', params }),
      providesTags: ['Order'],
    }),
    getOrder: builder.query<OrderRow, string>({
      query: (id) => `/emr/orders/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Order', id }],
    }),
    createOrder: builder.mutation<OrderRow, CreateOrderRequest>({
      query: (body) => ({ url: '/emr/orders', method: 'POST', body }),
      invalidatesTags: ['Order', 'Overview', 'Dashboard'],
    }),
    cancelOrder: builder.mutation<OrderRow, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/emr/orders/${id}/cancel`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['Order', 'Overview', 'Dashboard'],
    }),

    // results
    getResults: builder.query<{ items: ResultRow[] }, ResultsParams>({
      query: (params) => ({ url: '/emr/results', params }),
      providesTags: ['Result'],
    }),
    getCriticalResults: builder.query<
      { items: CriticalAlert[] },
      PatientScopedParams
    >({
      query: (params) => ({ url: '/emr/results/critical', params }),
      providesTags: ['Result'],
    }),
    getResult: builder.query<ResultDetail, string>({
      query: (id) => `/emr/results/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Result', id }],
    }),

    // appointments
    getClinic: builder.query<Clinic, void>({
      query: () => '/emr/appointments/clinic',
    }),
    getProviders: builder.query<{ items: Provider[] }, void>({
      query: () => '/emr/appointments/providers',
    }),
    getSlots: builder.query<
      { days: DaySlots[] },
      { practitionerId: string; from: string; days?: number }
    >({
      query: (params) => ({ url: '/emr/appointments/slots', params }),
      providesTags: ['Appointment'],
    }),
    getAppointments: builder.query<{ items: AppointmentRow[] }, AppointmentsParams>({
      query: (params) => ({ url: '/emr/appointments', params }),
      providesTags: ['Appointment'],
    }),
    getAppointment: builder.query<AppointmentRow, string>({
      query: (id) => `/emr/appointments/${id}`,
      providesTags: ['Appointment'],
    }),
    bookAppointment: builder.mutation<AppointmentRow, BookAppointmentRequest>({
      query: (body) => ({ url: '/emr/appointments', method: 'POST', body }),
      invalidatesTags: ['Appointment', 'Overview', 'Dashboard'],
    }),
    cancelAppointment: builder.mutation<
      AppointmentRow,
      { id: string; reason: string }
    >({
      query: ({ id, reason }) => ({
        url: `/emr/appointments/${id}/cancel`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['Appointment', 'Overview', 'Dashboard'],
    }),
    markNoShow: builder.mutation<AppointmentRow, string>({
      query: (id) => ({ url: `/emr/appointments/${id}/no-show`, method: 'POST' }),
      invalidatesTags: ['Appointment', 'Overview', 'Dashboard'],
    }),

    // vitals
    getVitalDefinitions: builder.query<VitalDefinition[], void>({
      query: () => '/emr/vitals/definitions',
    }),
    getVitals: builder.query<
      VitalsResponse,
      PatientScopedParams & { criticalOnly?: boolean }
    >({
      query: (params) => ({ url: '/emr/vitals', params }),
      providesTags: ['Vitals'],
    }),
    recordVitals: builder.mutation<unknown, RecordVitalsRequest>({
      query: (body) => ({ url: '/emr/vitals', method: 'POST', body }),
      invalidatesTags: ['Vitals', 'Overview', 'Dashboard'],
    }),

    // diagnoses
    getDiagnoses: builder.query<
      { items: DiagnosisRow[] },
      PatientScopedParams & { type?: DiagnosisType }
    >({
      query: (params) => ({ url: '/emr/diagnoses', params }),
      providesTags: ['Diagnosis'],
    }),
    createDiagnosis: builder.mutation<DiagnosisRow, CreateDiagnosisRequest>({
      query: (body) => ({ url: '/emr/diagnoses', method: 'POST', body }),
      invalidatesTags: ['Diagnosis', 'Overview'],
    }),

    // integration monitor
    getIntegrationMessages: builder.query<
      { items: IntegrationMessage[] },
      IntegrationMessagesParams
    >({
      query: (params) => ({ url: '/emr/integration/messages', params }),
      providesTags: ['Message'],
    }),
    getIntegrationMessage: builder.query<IntegrationMessageDetail, string>({
      query: (id) => `/emr/integration/messages/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Message', id }],
    }),
    retryIntegrationMessage: builder.mutation<IngestOutcome, string>({
      query: (id) => ({
        url: `/emr/integration/messages/${id}/retry`,
        method: 'POST',
      }),
      invalidatesTags: ['Message', 'Dashboard'],
    }),
    submitIntegrationMessage: builder.mutation<IngestOutcome, string>({
      query: (message) => ({
        url: '/emr/integration/messages',
        method: 'POST',
        body: { message },
      }),
      invalidatesTags: ['Message', 'Dashboard', 'Order', 'Result', 'Appointment'],
    }),

    // notifications
    getNotificationLog: builder.query<
      { items: NotificationLogRow[] },
      NotificationLogParams
    >({
      query: (params) => ({ url: '/emr/notifications', params }),
    }),
    getNotificationEvents: builder.query<{ items: NotificationEvent[] }, void>({
      query: () => '/emr/notifications/events',
    }),
    getTemplates: builder.query<{ items: TemplateRow[] }, void>({
      query: () => '/emr/notifications/templates',
      providesTags: ['Template'],
    }),
    createTemplate: builder.mutation<TemplateRow, CreateTemplateRequest>({
      query: (body) => ({
        url: '/emr/notifications/templates',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Template'],
    }),
    updateTemplate: builder.mutation<TemplateRow, UpdateTemplateRequest>({
      query: ({ id, ...body }) => ({
        url: `/emr/notifications/templates/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Template'],
    }),
    previewTemplate: builder.mutation<
      TemplatePreview,
      { eventCode: string; body: string; values?: Record<string, string> }
    >({
      query: (body) => ({
        url: '/emr/notifications/templates/preview',
        method: 'POST',
        body,
      }),
    }),

    // public FHIR capability statement
    getCapabilityStatement: builder.query<CapabilityStatement, void>({
      query: () => '/fhir/metadata',
    }),
  }),
})

export const {
  useGetDashboardSummaryQuery,
  useGetRegistrationDashboardQuery,
  useGetClinicalDashboardQuery,
  useGetIntegrationDashboardQuery,
  useGetWorklistQuery,
  useGetPatientOverviewQuery,
  useGetPatientEncountersQuery,
  useGetPatientAuditQuery,
  useRegisterPatientMutation,
  useGetOrderCatalogQuery,
  useGetOrdersQuery,
  useGetOrderQuery,
  useCreateOrderMutation,
  useCancelOrderMutation,
  useGetResultsQuery,
  useGetCriticalResultsQuery,
  useGetResultQuery,
  useGetClinicQuery,
  useGetProvidersQuery,
  useGetSlotsQuery,
  useGetAppointmentsQuery,
  useGetAppointmentQuery,
  useBookAppointmentMutation,
  useCancelAppointmentMutation,
  useMarkNoShowMutation,
  useGetVitalDefinitionsQuery,
  useGetVitalsQuery,
  useRecordVitalsMutation,
  useGetDiagnosesQuery,
  useCreateDiagnosisMutation,
  useGetIntegrationMessagesQuery,
  useGetIntegrationMessageQuery,
  useRetryIntegrationMessageMutation,
  useSubmitIntegrationMessageMutation,
  useGetNotificationLogQuery,
  useGetNotificationEventsQuery,
  useGetTemplatesQuery,
  useCreateTemplateMutation,
  useUpdateTemplateMutation,
  usePreviewTemplateMutation,
  useGetCapabilityStatementQuery,
} = emrApi
