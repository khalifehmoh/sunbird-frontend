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
import { useGetDashboardStatsQuery } from '../../../redux/features/dashboard/dashboardApi'
import { useGetAuditEventsQuery } from '../../../redux/features/audit/auditApi'
import type { AuditEvent } from '../../../redux/features/audit/auditTypes'
import { StatCard } from '../../../components/StatCard/StatCard'
import { formatDistanceToNow } from '../../../utils/time'
import { auditActionColor } from '../AuditManagement/auditConstants'
import { usePermissions } from '../../../hooks/usePermissions'

function DashboardAuditRow({ event }: { event: AuditEvent }) {
  const navigate = useNavigate()

  return (
    <Table.Tr
      style={{ cursor: 'pointer' }}
      onClick={() => navigate(`/admin/audit/${event.auditId}`)}
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
        <Badge variant="outline" size="sm" color="neutral">
          {event.entityType}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Text size="sm" truncate maw={160}>
          {event.entityName ?? '—'}
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

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const canReadAudit = usePermissions('AUDIT:READ')

  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
  } = useGetDashboardStatsQuery()

  const {
    data: auditData,
    isLoading: auditLoading,
    isError: auditError,
  } = useGetAuditEventsQuery(
    {
      page: 0,
      size: 10,
      search: '',
      sort: 'createdAt:desc',
    },
    { skip: !canReadAudit },
  )

  const chartData =
    stats?.activityByDay?.map((day) => ({
      date: day.date,
      Events: day.count,
    })) ?? []

  return (
    <Box p="xl">
      <Stack gap="xl">
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
                Could not load dashboard stats
              </Badge>
            )}
          </Group>
        </Group>

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

        {canReadAudit ? (
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
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} height={36} radius="sm" />
                ))}
              </Stack>
            ) : auditError ? (
              <Text size="sm" c="red">
                Could not load recent audit events.
              </Text>
            ) : (auditData?.content ?? []).length === 0 ? (
              <Text size="sm" c="dimmed">
                No audit events yet.
              </Text>
            ) : (
              <Table highlightOnHover striped withTableBorder={false}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>
                      <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                        Time
                      </Text>
                    </Table.Th>
                    <Table.Th>
                      <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                        User
                      </Text>
                    </Table.Th>
                    <Table.Th>
                      <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                        Action
                      </Text>
                    </Table.Th>
                    <Table.Th>
                      <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                        Entity
                      </Text>
                    </Table.Th>
                    <Table.Th>
                      <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                        Name
                      </Text>
                    </Table.Th>
                    <Table.Th>
                      <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                        Result
                      </Text>
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {(auditData?.content ?? []).map((event) => (
                    <DashboardAuditRow key={event.auditId} event={event} />
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Paper>
        ) : null}
      </Stack>
    </Box>
  )
}
