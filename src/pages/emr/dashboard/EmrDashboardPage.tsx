import {
  Alert,
  Badge,
  Box,
  Grid,
  Group,
  Paper,
  SimpleGrid,
  Table,
  Tabs,
  Text,
  Title,
} from '@mantine/core'
import { BarChart, LineChart } from '@mantine/charts'
import {
  Activity,
  AlertTriangle,
  BedDouble,
  CalendarCheck,
  ClipboardList,
  HeartPulse,
  LogIn,
  LogOut,
  Stethoscope,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { StatCard } from '../../../components/StatCard/StatCard'
import { EmrAccess } from '../../../constants/permissions'
import { useHasPermissions } from '../../../hooks/usePermissions'
import {
  useGetClinicalDashboardQuery,
  useGetDashboardSummaryQuery,
  useGetIntegrationDashboardQuery,
  useGetRegistrationDashboardQuery,
} from '../../../redux/features/emr/emrApi'
import { PageHeader } from '../shared/PageHeader'
import { QueryState } from '../shared/QueryState'
import { formatDateTime, formatDate } from '../shared/format'
import { CriticalAlertsPanel } from './CriticalAlertsPanel'

const ALERT_POLL_MS = 60_000

function TruncatedNote({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <Alert color="yellow" mb="md" title="Partial figures">
      A window held more encounters than one page; the counts shown are lower
      bounds.
    </Alert>
  )
}

function OverviewTab() {
  const { data, isLoading, error } = useGetDashboardSummaryQuery(undefined, {
    pollingInterval: ALERT_POLL_MS,
  })
  const kpis = data?.kpis

  return (
    <QueryState isLoading={isLoading} error={error}>
      <TruncatedNote show={!!data?.truncated} />
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="md">
        <StatCard
          label="Active inpatients"
          value={kpis?.activeInpatients}
          icon={<BedDouble size={26} />}
          color="blue"
          href="/emr/patients?filter=inpatient"
        />
        <StatCard
          label="OPD visits today"
          value={kpis?.opdVisitsToday}
          icon={<Stethoscope size={26} />}
          color="teal"
          href="/emr/patients?filter=opd"
        />
        <StatCard
          label="Admissions today"
          value={kpis?.admissionsToday}
          icon={<LogIn size={26} />}
          color="indigo"
        />
        <StatCard
          label="Discharges today"
          value={kpis?.dischargesToday}
          icon={<LogOut size={26} />}
          color="grape"
        />
        <StatCard
          label="Appointments today"
          value={kpis?.appointmentsToday}
          icon={<CalendarCheck size={26} />}
          color="cyan"
          href="/emr/appointments"
        />
        <StatCard
          label="Pending orders"
          value={kpis?.pendingOrders}
          icon={<ClipboardList size={26} />}
          color="orange"
          href="/emr/orders?status=active"
        />
        <StatCard
          label="Critical results today"
          value={kpis?.criticalResultsToday}
          icon={<AlertTriangle size={26} />}
          color="red"
          href="/emr/results/critical"
        />
        <StatCard
          label="Vitals recorded today"
          value={kpis?.vitalsRecordedToday}
          icon={<HeartPulse size={26} />}
          color="pink"
          href="/emr/vitals"
        />
      </SimpleGrid>

      <Grid>
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Paper withBorder radius="md" p="md">
            <Group gap="xs" mb="sm">
              <Activity size={18} />
              <Title order={4}>7-day activity</Title>
            </Group>
            <LineChart
              h={300}
              data={(data?.activity ?? []).map((day) => ({
                ...day,
                date: formatDate(day.date),
              }))}
              dataKey="date"
              withLegend
              series={[
                { name: 'admissions', label: 'Admissions', color: 'indigo.6' },
                { name: 'discharges', label: 'Discharges', color: 'grape.6' },
                { name: 'opdVisits', label: 'OPD visits', color: 'teal.6' },
              ]}
              curveType="linear"
            />
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, lg: 4 }}>
          <CriticalAlertsPanel alerts={data?.criticalAlerts ?? []} />
        </Grid.Col>
      </Grid>
    </QueryState>
  )
}

function RegistrationTab() {
  const { data, isLoading, error } = useGetRegistrationDashboardQuery()
  const kpis = data?.kpis

  return (
    <QueryState isLoading={isLoading} error={error}>
      <TruncatedNote show={!!data?.truncated} />
      <SimpleGrid cols={{ base: 2, md: 3, lg: 6 }} mb="md">
        <StatCard label="OPD visits" value={kpis?.opdVisits} icon={<Stethoscope size={26} />} color="teal" />
        <StatCard label="Admissions" value={kpis?.admissions} icon={<LogIn size={26} />} color="indigo" />
        <StatCard label="Discharges" value={kpis?.discharges} icon={<LogOut size={26} />} color="grape" />
        <StatCard label="Appointments" value={kpis?.appointments} icon={<CalendarCheck size={26} />} color="cyan" />
        <StatCard label="Cancellations" value={kpis?.cancellations} icon={<AlertTriangle size={26} />} color="orange" />
        <StatCard label="No-shows" value={kpis?.noShows} icon={<Activity size={26} />} color="gray" />
      </SimpleGrid>
      <Paper withBorder radius="md" p="md">
        <Title order={4} mb="sm">
          Today&apos;s events
        </Title>
        {(data?.events.length ?? 0) === 0 ? (
          <Text c="dimmed" size="sm">
            No events yet today.
          </Text>
        ) : (
          <Table.ScrollContainer minWidth={600}>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Time</Table.Th>
                  <Table.Th>Event</Table.Th>
                  <Table.Th>Patient</Table.Th>
                  <Table.Th>Description</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data?.events.map((event, index) => (
                  <Table.Tr key={`${event.at}-${index}`}>
                    <Table.Td>{formatDateTime(event.at)}</Table.Td>
                    <Table.Td>
                      <Badge variant="light">{event.event}</Badge>
                    </Table.Td>
                    <Table.Td>
                      {event.patientId ? (
                        <Text
                          component={Link}
                          to={`/emr/patients/${event.patientId}`}
                          c="blue"
                          size="sm"
                        >
                          {event.patientName ?? event.patientId}
                        </Text>
                      ) : (
                        '—'
                      )}
                      {event.mrn && (
                        <Text size="xs" c="dimmed">
                          {event.mrn}
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>{event.description}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Paper>
    </QueryState>
  )
}

function ClinicalTab() {
  const { data, isLoading, error } = useGetClinicalDashboardQuery()
  const kpis = data?.kpis

  return (
    <QueryState isLoading={isLoading} error={error}>
      <SimpleGrid cols={{ base: 2, md: 3, lg: 6 }} mb="md">
        <StatCard label="Active inpatients" value={kpis?.activeInpatients} icon={<BedDouble size={26} />} color="blue" />
        <StatCard label="Orders today" value={kpis?.ordersToday} icon={<ClipboardList size={26} />} color="indigo" />
        <StatCard label="Pending orders" value={kpis?.pendingOrders} icon={<ClipboardList size={26} />} color="orange" />
        <StatCard label="Critical results" value={kpis?.criticalResultsToday} icon={<AlertTriangle size={26} />} color="red" />
        <StatCard label="Vitals recorded" value={kpis?.vitalsRecordedToday} icon={<HeartPulse size={26} />} color="pink" />
        <StatCard
          label="Avg. length of stay (days)"
          value={kpis?.averageLengthOfStayDays ?? undefined}
          icon={<Activity size={26} />}
          color="teal"
        />
      </SimpleGrid>
      <Paper withBorder radius="md" p="md">
        <Title order={4} mb="sm">
          Inpatients by ward
        </Title>
        {(data?.inpatientsByWard.length ?? 0) === 0 ? (
          <Text c="dimmed" size="sm">
            No inpatients.
          </Text>
        ) : (
          <BarChart
            h={300}
            data={data?.inpatientsByWard ?? []}
            dataKey="ward"
            series={[{ name: 'count', label: 'Inpatients', color: 'blue.6' }]}
          />
        )}
      </Paper>
    </QueryState>
  )
}

function IntegrationTab() {
  const { data, isLoading, error } = useGetIntegrationDashboardQuery()

  return (
    <QueryState isLoading={isLoading} error={error}>
      <SimpleGrid cols={{ base: 2, md: 4 }} mb="md">
        <StatCard label="Received today" value={data?.received} icon={<LogIn size={26} />} color="blue" href="/emr/integration" />
        <StatCard label="Processed" value={data?.processed} icon={<Activity size={26} />} color="teal" href="/emr/integration?status=PROCESSED" />
        <StatCard label="Failed" value={data?.failed} icon={<AlertTriangle size={26} />} color="red" href="/emr/integration?status=FAILED" />
        <Paper withBorder radius="md" p="lg">
          <Text size="xs" tt="uppercase" fw={700} c="dimmed" lts={1}>
            Failure rate
          </Text>
          <Title order={2} c={(data?.failureRatePercent ?? 0) > 5 ? 'red' : undefined}>
            {data?.failureRatePercent ?? 0}%
          </Title>
        </Paper>
      </SimpleGrid>
      <Grid>
        <Grid.Col span={{ base: 12, lg: 6 }}>
          <Paper withBorder radius="md" p="md">
            <Title order={4} mb="sm">
              Messages by type
            </Title>
            {(data?.byType.length ?? 0) === 0 ? (
              <Text c="dimmed" size="sm">
                No traffic today.
              </Text>
            ) : (
              <BarChart
                h={260}
                data={data?.byType ?? []}
                dataKey="messageType"
                withLegend
                series={[
                  { name: 'count', label: 'Total', color: 'blue.6' },
                  { name: 'failed', label: 'Failed', color: 'red.6' },
                ]}
              />
            )}
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, lg: 6 }}>
          <Paper withBorder radius="md" p="md">
            <Group justify="space-between" mb="sm">
              <Title order={4}>Recent errors</Title>
              <Text component={Link} to="/emr/integration?status=FAILED" c="blue" size="sm">
                Open monitor
              </Text>
            </Group>
            {(data?.recentErrors.length ?? 0) === 0 ? (
              <Text c="dimmed" size="sm">
                No errors.
              </Text>
            ) : (
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>When</Table.Th>
                    <Table.Th>Stage</Table.Th>
                    <Table.Th>Error</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {data?.recentErrors.map((entry) => (
                    <Table.Tr key={`${entry.messageId}-${entry.at}`}>
                      <Table.Td>{formatDateTime(entry.at)}</Table.Td>
                      <Table.Td>{entry.stage}</Table.Td>
                      <Table.Td>
                        <Text
                          component={Link}
                          to={`/emr/integration/transaction/${entry.messageId}`}
                          size="sm"
                          c="blue"
                        >
                          {entry.code}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {entry.message}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Paper>
        </Grid.Col>
      </Grid>
    </QueryState>
  )
}

export function EmrDashboardPage() {
  const canSeeIntegration = useHasPermissions(EmrAccess.integrationView)

  return (
    <Box p="md">
      <PageHeader
        title="EMR dashboard"
        description="Live figures for today across registration, clinical activity and integration."
      />
      <Tabs defaultValue="overview" keepMounted={false}>
        <Tabs.List mb="md">
          <Tabs.Tab value="overview">Overview</Tabs.Tab>
          <Tabs.Tab value="registration">Registration</Tabs.Tab>
          <Tabs.Tab value="clinical">Clinical</Tabs.Tab>
          {canSeeIntegration && (
            <Tabs.Tab value="integration">Integration</Tabs.Tab>
          )}
        </Tabs.List>
        <Tabs.Panel value="overview">
          <OverviewTab />
        </Tabs.Panel>
        <Tabs.Panel value="registration">
          <RegistrationTab />
        </Tabs.Panel>
        <Tabs.Panel value="clinical">
          <ClinicalTab />
        </Tabs.Panel>
        {canSeeIntegration && (
          <Tabs.Panel value="integration">
            <IntegrationTab />
          </Tabs.Panel>
        )}
      </Tabs>
    </Box>
  )
}
