import { useParams, useSearchParams, Link } from 'react-router-dom'
import { Badge, Box, Button, Group, Paper, Stack, Table, Tabs, Text } from '@mantine/core'
import {
  useGetAppointmentsQuery,
  useGetDiagnosesQuery,
  useGetOrdersQuery,
  useGetPatientEncountersQuery,
  useGetPatientOverviewQuery,
  useGetResultsQuery,
  useGetVitalsQuery,
} from '../../../redux/features/emr/emrApi'
import { PageHeader } from '../shared/PageHeader'
import { QueryState } from '../shared/QueryState'
import {
  PATIENT_CLASS_COLOR,
  PATIENT_CLASS_LABEL,
  formatDate,
  formatDateTime,
  genderLabel,
} from '../shared/format'
import {
  AppointmentsTable,
  DiagnosesTable,
  OrdersTable,
  ResultsTable,
  VitalsTable,
} from '../shared/tables'
import { PatientActions } from './PatientActions'
import { PatientAuditView } from './PatientAuditView'

const TABS = [
  'encounters',
  'orders',
  'results',
  'vitals',
  'diagnoses',
  'appointments',
  'audit',
] as const
type TabKey = (typeof TABS)[number]

function EncountersTab({ patientId }: { patientId: string }) {
  const { data, isLoading, error } = useGetPatientEncountersQuery(patientId)
  const rows = data?.items ?? []
  return (
    <QueryState isLoading={isLoading} error={error} empty={rows.length === 0} emptyMessage="No encounters.">
      <Table.ScrollContainer minWidth={600}>
        <Table highlightOnHover verticalSpacing="xs">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Visit</Table.Th>
              <Table.Th>Class</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Location</Table.Th>
              <Table.Th>Start</Table.Th>
              <Table.Th>End</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((row) => (
              <Table.Tr key={row.id}>
                <Table.Td>
                  <Text component={Link} to={`/clinical/encounters/${row.id}`} size="sm" c="blue">
                    {row.visitNumber ?? row.id.slice(0, 8)}
                  </Text>
                </Table.Td>
                <Table.Td>{PATIENT_CLASS_LABEL[row.patientClass] ?? row.patientClass}</Table.Td>
                <Table.Td>{row.status}</Table.Td>
                <Table.Td>{row.locationDisplay ?? '—'}</Table.Td>
                <Table.Td>{formatDateTime(row.periodStart)}</Table.Td>
                <Table.Td>{formatDateTime(row.periodEnd)}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </QueryState>
  )
}

function OrdersTab({ patientId }: { patientId: string }) {
  const { data, isLoading, error } = useGetOrdersQuery({ patientId, limit: 50 })
  const rows = data?.items ?? []
  return (
    <QueryState isLoading={isLoading} error={error} empty={rows.length === 0} emptyMessage="No orders.">
      <OrdersTable rows={rows} showPatient={false} />
    </QueryState>
  )
}

function ResultsTab({ patientId }: { patientId: string }) {
  const { data, isLoading, error } = useGetResultsQuery({ patientId, limit: 50 })
  const rows = data?.items ?? []
  return (
    <QueryState isLoading={isLoading} error={error} empty={rows.length === 0} emptyMessage="No results.">
      <ResultsTable rows={rows} showPatient={false} />
    </QueryState>
  )
}

function VitalsTab({ patientId }: { patientId: string }) {
  const { data, isLoading, error } = useGetVitalsQuery({ patientId, limit: 100 })
  const rows = data?.items ?? []
  return (
    <QueryState isLoading={isLoading} error={error} empty={rows.length === 0} emptyMessage="No vitals.">
      <VitalsTable rows={rows} />
    </QueryState>
  )
}

function DiagnosesTab({ patientId }: { patientId: string }) {
  const { data, isLoading, error } = useGetDiagnosesQuery({ patientId, limit: 50 })
  const rows = data?.items ?? []
  return (
    <QueryState isLoading={isLoading} error={error} empty={rows.length === 0} emptyMessage="No diagnoses.">
      <DiagnosesTable rows={rows} />
    </QueryState>
  )
}

function AppointmentsTab({ patientId }: { patientId: string }) {
  const { data, isLoading, error } = useGetAppointmentsQuery({ patientId, limit: 50 })
  const rows = data?.items ?? []
  return (
    <QueryState isLoading={isLoading} error={error} empty={rows.length === 0} emptyMessage="No appointments.">
      <AppointmentsTable rows={rows} showPatient={false} />
    </QueryState>
  )
}

export function PatientProfilePage() {
  const { id = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const tabParam = params.get('tab')
  const tab: TabKey = TABS.includes(tabParam as TabKey) ? (tabParam as TabKey) : 'encounters'
  const { data, isLoading, error } = useGetPatientOverviewQuery(id)
  const patient = data?.patient

  return (
    <Box p="md">
      <PageHeader
        title={patient?.name ?? 'Patient'}
        crumbs={[{ label: 'Patients', to: '/emr/patients' }, { label: 'Profile' }]}
        actions={
          <Button component={Link} to={`/emr/patients/${id}/audit`} variant="default" size="xs">
            Audit trail
          </Button>
        }
      />
      <QueryState isLoading={isLoading} error={error}>
        {data && patient && (
          <Stack gap="md">
            <Paper withBorder radius="md" p="md">
              <Group justify="space-between" align="flex-start">
                <Stack gap={4}>
                  <Group gap="xs">
                    <Badge variant="outline">{patient.mrn ?? 'No MRN'}</Badge>
                    {data.activeEncounter && (
                      <Badge
                        color={PATIENT_CLASS_COLOR[data.activeEncounter.patientClass] ?? 'gray'}
                        variant="light"
                      >
                        {PATIENT_CLASS_LABEL[data.activeEncounter.patientClass] ??
                          data.activeEncounter.patientClass}
                        {data.ward ? ` · ${data.ward}` : ''}
                      </Badge>
                    )}
                    {patient.allergies.map((allergy) => (
                      <Badge key={allergy} color="red">
                        {allergy}
                      </Badge>
                    ))}
                  </Group>
                  <Text size="sm" c="dimmed">
                    {genderLabel(patient.gender)}
                    {patient.birthDate
                      ? ` · ${formatDate(patient.birthDate)}${patient.ageYears !== null ? ` (${patient.ageYears} y)` : ''}`
                      : ''}
                    {patient.mobile ? ` · ${patient.mobile}` : ''}
                  </Text>
                  {patient.nameAr && (
                    <Text size="sm" dir="rtl">
                      {patient.nameAr}
                    </Text>
                  )}
                </Stack>
                <PatientActions
                  patientId={id}
                  encounterId={data.activeEncounter?.id}
                  patientClass={data.activeEncounter?.patientClass}
                  hideChart
                />
              </Group>
            </Paper>

            <Tabs
              value={tab}
              onChange={(value) => {
                const next = new URLSearchParams(params)
                next.set('tab', value ?? 'encounters')
                setParams(next, { replace: true })
              }}
              keepMounted={false}
            >
              <Tabs.List mb="md">
                <Tabs.Tab value="encounters">Encounters ({data.counts.encounters})</Tabs.Tab>
                <Tabs.Tab value="orders">Orders ({data.counts.orders})</Tabs.Tab>
                <Tabs.Tab value="results">Results ({data.counts.results})</Tabs.Tab>
                <Tabs.Tab value="vitals">Vitals ({data.counts.vitals})</Tabs.Tab>
                <Tabs.Tab value="diagnoses">Diagnoses ({data.counts.diagnoses})</Tabs.Tab>
                <Tabs.Tab value="appointments">Appointments ({data.counts.appointments})</Tabs.Tab>
                <Tabs.Tab value="audit">Audit</Tabs.Tab>
              </Tabs.List>
              <Tabs.Panel value="encounters"><EncountersTab patientId={id} /></Tabs.Panel>
              <Tabs.Panel value="orders"><OrdersTab patientId={id} /></Tabs.Panel>
              <Tabs.Panel value="results"><ResultsTab patientId={id} /></Tabs.Panel>
              <Tabs.Panel value="vitals"><VitalsTab patientId={id} /></Tabs.Panel>
              <Tabs.Panel value="diagnoses"><DiagnosesTab patientId={id} /></Tabs.Panel>
              <Tabs.Panel value="appointments"><AppointmentsTab patientId={id} /></Tabs.Panel>
              <Tabs.Panel value="audit"><PatientAuditView patientId={id} /></Tabs.Panel>
            </Tabs>
          </Stack>
        )}
      </QueryState>
    </Box>
  )
}
