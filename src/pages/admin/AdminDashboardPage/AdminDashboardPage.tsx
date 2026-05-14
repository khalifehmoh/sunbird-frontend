import { useNavigate } from 'react-router-dom'
import {
  Badge,
  Box,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Text,
  Title,
  Tooltip,
  UnstyledButton,
} from '@mantine/core'
import { BarChart } from '@mantine/charts'
import {
  Building2,
  Users,
  MonitorCheck,
  ShieldAlert,
  TrendingUp,
  ExternalLink,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import {
  useGetDashboardStatsQuery,
  useGetRecentAuditEventsQuery,
  type AuditEvent,
  type AuditEventsResponse,
  type DashboardStats,
} from '../../../redux/features/dashboard/dashboardApi'
import { StatCard } from '../../../components/StatCard/StatCard'
import { formatDistanceToNow } from '../../../utils/time'

// ---------------------------------------------------------------------------
// Dummy data — used when the API is unavailable (development / testing)
// ---------------------------------------------------------------------------

const DUMMY_STATS: DashboardStats = {
  tenantCount: 12,
  userCount: 148,
  activeSessionCount: 23,
  auditCount24h: 317,
  activityByDay: [
    { date: 'Mon', count: 42 },
    { date: 'Tue', count: 87 },
    { date: 'Wed', count: 61 },
    { date: 'Thu', count: 105 },
    { date: 'Fri', count: 93 },
    { date: 'Sat', count: 34 },
    { date: 'Sun', count: 19 },
  ],
}

const DUMMY_AUDIT_EVENTS: AuditEventsResponse = {
  content: [
    { id: '1', createdAt: new Date(Date.now() - 3 * 60000).toISOString(),   username: 'admin',      actionType: 'LOGIN',        entityType: 'USER',       entityName: 'admin',           success: true  },
    { id: '2', createdAt: new Date(Date.now() - 8 * 60000).toISOString(),   username: 'zeina',      actionType: 'UPDATE',       entityType: 'TENANT',     entityName: 'Al-Shifa Hosp.',  success: true  },
    { id: '3', createdAt: new Date(Date.now() - 15 * 60000).toISOString(),  username: 'mohammad',   actionType: 'CREATE',       entityType: 'USER',       entityName: 'new.user',        success: true  },
    { id: '4', createdAt: new Date(Date.now() - 22 * 60000).toISOString(),  username: null,         actionType: 'FAILED_LOGIN', entityType: 'USER',       entityName: 'unknown',         success: false },
    { id: '5', createdAt: new Date(Date.now() - 45 * 60000).toISOString(),  username: 'alaa',       actionType: 'DELETE',       entityType: 'BRANCH',     entityName: 'East Branch',     success: true  },
    { id: '6', createdAt: new Date(Date.now() - 70 * 60000).toISOString(),  username: 'zeina',      actionType: 'CREATE',       entityType: 'ROLE',       entityName: 'BRANCH_MANAGER',  success: true  },
    { id: '7', createdAt: new Date(Date.now() - 95 * 60000).toISOString(),  username: 'mohammad',   actionType: 'UPDATE',       entityType: 'PERMISSION', entityName: 'USER:DELETE',     success: true  },
    { id: '8', createdAt: new Date(Date.now() - 130 * 60000).toISOString(), username: null,         actionType: 'FAILED_LOGIN', entityType: 'USER',       entityName: 'hacker123',       success: false },
    { id: '9', createdAt: new Date(Date.now() - 160 * 60000).toISOString(), username: 'admin',      actionType: 'APPROVE',      entityType: 'TENANT',     entityName: 'Gulf Medical',    success: true  },
    { id: '10', createdAt: new Date(Date.now() - 200 * 60000).toISOString(), username: 'alaa',      actionType: 'LOGOUT',       entityType: 'USER',       entityName: 'alaa',            success: true  },
  ],
  totalElements: 10,
  totalPages: 1,
  page: 0,
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'teal',
  UPDATE: 'yellow',
  DELETE: 'red',
  LOGIN: 'blue',
  LOGOUT: 'gray',
  FAILED_LOGIN: 'orange',
  APPROVE: 'green',
  REVOKE: 'pink',
}

function auditActionColor(action: string) {
  return ACTION_COLORS[action] ?? 'gray'
}

function DashboardAuditRow({ event }: { event: AuditEvent }) {
  const navigate = useNavigate()

  return (
    <Table.Tr
      style={{ cursor: 'pointer' }}
      onClick={() => navigate(`/admin/audit/${event.id}`)}
    >
      <Table.Td>
        <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
          {formatDistanceToNow(event.createdAt)}
        </Text>
      </Table.Td>
      <Table.Td>
        {event.username ? (
          <Text size="sm" fw={500}>
            {event.username}
          </Text>
        ) : (
          <Text size="sm" c="dimmed" fs="italic">
            System
          </Text>
        )}
      </Table.Td>
      <Table.Td>
        <Badge
          color={auditActionColor(event.actionType)}
          variant="light"
          size="sm"
          tt="uppercase"
        >
          {event.actionType}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Badge variant="outline" size="sm" color="gray">
          {event.entityType}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Text size="sm" truncate maw={160}>
          {event.entityName}
        </Text>
      </Table.Td>
      <Table.Td>
        <Tooltip
          label={event.success ? 'Success' : 'Failed'}
          withArrow
          position="left"
        >
          {event.success ? (
            <CheckCircle2 size={16} color="var(--mantine-color-teal-6)" />
          ) : (
            <XCircle size={16} color="var(--mantine-color-red-6)" />
          )}
        </Tooltip>
      </Table.Td>
    </Table.Tr>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function AdminDashboardPage() {
  const navigate = useNavigate()

  const {
    data: statsData,
    isLoading: statsLoading,
    isError: statsError,
  } = useGetDashboardStatsQuery()

  const {
    data: auditApiData,
    isLoading: auditLoading,
  } = useGetRecentAuditEventsQuery()

  // Fall back to dummy data when the API hasn't returned yet or errored
  const stats = statsData ?? (statsLoading ? undefined : DUMMY_STATS)
  const auditData = auditApiData ?? (auditLoading ? undefined : DUMMY_AUDIT_EVENTS)

  const chartData =
    stats?.activityByDay?.map((d) => ({
      date: d.date,
      Events: d.count,
    })) ?? []

  return (
    <Box p="xl">
      <Stack gap="xl">
        {/* Page header */}
        <Group justify="space-between" align="flex-start">
          <Stack gap={2}>
            <Title order={2}>Admin Dashboard</Title>
            <Text c="dimmed" size="sm">
              System health overview
            </Text>
          </Stack>
          <Group gap="xs">
            {statsLoading && <Loader size="sm" />}
            {statsError && (
              <Badge
                color="orange"
                variant="light"
                leftSection={<ShieldAlert size={12} />}
              >
                API unavailable — showing demo data
              </Badge>
            )}
          </Group>
        </Group>

        {/* KPI cards */}
        <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="md">
          <StatCard
            label="Active Tenants"
            value={stats?.tenantCount}
            icon={<Building2 size={26} />}
            color="blue"
            href="/admin/tenants"
            loading={statsLoading}
          />
          <StatCard
            label="Active Users"
            value={stats?.userCount}
            icon={<Users size={26} />}
            color="teal"
            href="/admin/users"
            loading={statsLoading}
          />
          <StatCard
            label="Active Sessions"
            value={stats?.activeSessionCount}
            icon={<MonitorCheck size={26} />}
            color="violet"
            href="/admin/sessions"
            loading={statsLoading}
          />
          <StatCard
            label="Audit Events (24h)"
            value={stats?.auditCount24h}
            icon={<TrendingUp size={26} />}
            color="orange"
            href="/admin/audit"
            loading={statsLoading}
          />
        </SimpleGrid>

        {/* Activity chart */}
        <Paper withBorder radius="md" p="lg">
          <Stack gap="md">
            <Stack gap={2}>
              <Text fw={600}>Activity — Last 7 Days</Text>
              <Text size="xs" c="dimmed">
                Audit events per day
              </Text>
            </Stack>

            {statsLoading ? (
              <Skeleton height={220} radius="md" />
            ) : (
              <BarChart
                h={220}
                data={chartData}
                dataKey="date"
                series={[{ name: 'Events', color: 'blue.6' }]}
                tickLine="none"
                gridAxis="y"
                barProps={{ radius: 4 }}
              />
            )}
          </Stack>
        </Paper>

        {/* Recent audit events */}
        <Paper withBorder radius="md" p="lg">
          <Group justify="space-between" mb="md">
            <Stack gap={2}>
              <Text fw={600}>Recent Audit Events</Text>
              <Text size="xs" c="dimmed">
                Last 10 system events
              </Text>
            </Stack>
            <UnstyledButton
              onClick={() => navigate('/admin/audit')}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Text size="sm" c="blue" fw={500}>
                View full log
              </Text>
              <ExternalLink size={14} color="var(--mantine-color-blue-6)" />
            </UnstyledButton>
          </Group>

          {auditLoading ? (
            <Stack gap="xs">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} height={36} radius="sm" />
              ))}
            </Stack>
          ) : (
            <Table highlightOnHover striped withTableBorder={false}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>
                    <Text size="xs" tt="uppercase" fw={700} c="dimmed">Time</Text>
                  </Table.Th>
                  <Table.Th>
                    <Text size="xs" tt="uppercase" fw={700} c="dimmed">User</Text>
                  </Table.Th>
                  <Table.Th>
                    <Text size="xs" tt="uppercase" fw={700} c="dimmed">Action</Text>
                  </Table.Th>
                  <Table.Th>
                    <Text size="xs" tt="uppercase" fw={700} c="dimmed">Entity</Text>
                  </Table.Th>
                  <Table.Th>
                    <Text size="xs" tt="uppercase" fw={700} c="dimmed">Name</Text>
                  </Table.Th>
                  <Table.Th>
                    <Text size="xs" tt="uppercase" fw={700} c="dimmed">Result</Text>
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(auditData?.content ?? []).map((event) => (
                  <DashboardAuditRow key={event.id} event={event} />
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Paper>
      </Stack>
    </Box>
  )
}
