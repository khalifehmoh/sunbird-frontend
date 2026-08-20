import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Paper,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import { LogOut, RefreshCw, Search, Trash2 } from 'lucide-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import {
  useGetActiveSessionsQuery,
  useTerminateAllSessionsMutation,
  useTerminateSessionMutation,
} from '../../../../redux/features/users/usersApi'
import type { ActiveSessionItem } from '../../../../redux/features/users/usersTypes'
import { DataTable } from '../../../../components/DataTable/DataTable'
import { usePermissions } from '../../../../hooks/usePermissions'
import { useAppSelector } from '../../../../redux/store'
import { isPlatformAdmin } from '../../../../hooks/useAuth'
import { notify } from '../../../../lib/notify'
import { formatUserAgent } from '../../../../utils/userAgent'
import {
  formatCountdown,
  formatDuration,
  isStaleActivity,
} from '../auditConstants'

dayjs.extend(relativeTime)

const PAGE_SIZE = 20
const REFRESH_MS = 30_000

export function ActiveSessionsPage() {
  const canRead = usePermissions('SESSION:READ')
  const canDelete = usePermissions('SESSION:DELETE')
  const role = useAppSelector((state) => state.auth.role)
  const showTenant = isPlatformAdmin(role)

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebouncedValue(search, 300)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const { data, isLoading, isFetching, refetch } = useGetActiveSessionsQuery(
    {
      page: page - 1,
      size: PAGE_SIZE,
      search: debouncedSearch,
    },
    {
      skip: !canRead,
      pollingInterval: autoRefresh ? REFRESH_MS : 0,
    },
  )
  const [terminateSession] = useTerminateSessionMutation()
  const [terminateAll] = useTerminateAllSessionsMutation()

  const rows = data?.content ?? []
  const liveCount = data?.totalElements ?? 0

  const staleCount = useMemo(
    () => rows.filter((session) => isStaleActivity(session.lastActivityAt)).length,
    [rows],
  )

  function confirmTerminate(session: ActiveSessionItem) {
    modals.openConfirmModal({
      title: 'Terminate session',
      children: (
        <Text size="sm">
          End the session for <strong>{session.username}</strong>
          {session.ipAddress ? ` (${session.ipAddress})` : ''}? They will need
          to sign in again.
        </Text>
      ),
      labels: { confirm: 'Terminate', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await terminateSession({
            sessionId: session.sessionId,
            userId: session.userId,
          }).unwrap()
          notify({
            type: 'success',
            title: 'Session terminated',
            message: `${session.username} was signed out.`,
          })
        } catch {
          // Shared base query shows API errors.
        }
      },
    })
  }

  function confirmTerminateAll(session: ActiveSessionItem) {
    modals.openConfirmModal({
      title: 'Terminate all sessions',
      children: (
        <Text size="sm">
          End every active session for <strong>{session.username}</strong>?
        </Text>
      ),
      labels: { confirm: 'Terminate all', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          const result = await terminateAll(session.userId).unwrap()
          notify({
            type: 'success',
            title: 'Sessions terminated',
            message: `${result.terminated} session(s) ended for ${session.username}.`,
          })
        } catch {
          // Shared base query shows API errors.
        }
      },
    })
  }

  if (!canRead) {
    return (
      <Box p="xl">
        <Text>You don&apos;t have permission to view sessions.</Text>
      </Box>
    )
  }

  return (
    <Box p="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Stack gap={4}>
            <Group gap="sm">
              <Title order={2}>Active sessions</Title>
              <Badge color="violet" variant="light" size="lg">
                {liveCount} active now
              </Badge>
            </Group>
            <Text c="dimmed" size="sm">
              Live sessions across {showTenant ? 'all tenants' : 'this tenant'}.
              Idle longer than 25 minutes are highlighted.
            </Text>
          </Stack>
          <Group gap="sm">
            <Switch
              label="Auto-refresh"
              checked={autoRefresh}
              onChange={(event) =>
                setAutoRefresh(event.currentTarget.checked)
              }
            />
            <Button
              variant="light"
              leftSection={<RefreshCw size={16} />}
              loading={isFetching && !isLoading}
              onClick={() => void refetch()}
            >
              Refresh now
            </Button>
          </Group>
        </Group>

        <Paper withBorder radius="md" p="md">
          <Group justify="space-between" wrap="wrap">
            <TextInput
              placeholder="Search user or IP"
              leftSection={<Search size={16} />}
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              style={{ flex: '1 1 260px' }}
            />
            {staleCount > 0 ? (
              <Badge color="orange" variant="light">
                {staleCount} idle on this page
              </Badge>
            ) : null}
          </Group>
        </Paper>

        <DataTable
          isLoading={isLoading}
          isFetching={isFetching}
          totalElements={liveCount}
          totalPages={data?.totalPages ?? 0}
          page={page}
          onPageChange={setPage}
          colSpan={showTenant ? 9 : 8}
          minWidth={1100}
          countLabel="active session(s)"
          emptyMessage="No active sessions."
        >
          <DataTable.Header>
            <Table.Th>User</Table.Th>
            {showTenant ? <Table.Th>Tenant</Table.Th> : null}
            <Table.Th>Login</Table.Th>
            <Table.Th>Last activity</Table.Th>
            <Table.Th>Expires</Table.Th>
            <Table.Th>IP</Table.Th>
            <Table.Th>Browser</Table.Th>
            <Table.Th>Duration</Table.Th>
            <Table.Th ta="right">Actions</Table.Th>
          </DataTable.Header>
          <DataTable.Body>
            {rows.map((session) => {
              const stale = isStaleActivity(session.lastActivityAt)
              return (
                <Table.Tr
                  key={session.sessionId}
                  style={{
                    background: stale
                      ? 'var(--mantine-color-orange-light)'
                      : undefined,
                  }}
                >
                  <Table.Td>
                    <Text
                      size="sm"
                      fw={500}
                      component={Link}
                      to={`/admin/users/${session.userId}`}
                    >
                      {session.fullName ?? session.username}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {session.username}
                    </Text>
                  </Table.Td>
                  {showTenant ? (
                    <Table.Td>
                      <Text size="sm">{session.tenantName ?? '—'}</Text>
                    </Table.Td>
                  ) : null}
                  <Table.Td>
                    <Text size="sm">
                      {session.loginAt
                        ? dayjs(session.loginAt).format('MMM D, h:mm A')
                        : '—'}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c={stale ? 'orange' : undefined} fw={stale ? 600 : 400}>
                      {session.lastActivityAt
                        ? dayjs(session.lastActivityAt).fromNow()
                        : '—'}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{formatCountdown(session.expiresAt)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{session.ipAddress ?? '—'}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{formatUserAgent(session.userAgent)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{formatDuration(session.loginAt)}</Text>
                  </Table.Td>
                  <Table.Td ta="right">
                    {canDelete ? (
                      <Group gap={4} justify="flex-end">
                        <Tooltip label="Terminate session">
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            aria-label="Terminate session"
                            onClick={() => confirmTerminate(session)}
                          >
                            <Trash2 size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Terminate all for user">
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            aria-label="Terminate all sessions for user"
                            onClick={() => confirmTerminateAll(session)}
                          >
                            <LogOut size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    ) : null}
                  </Table.Td>
                </Table.Tr>
              )
            })}
          </DataTable.Body>
        </DataTable>
      </Stack>
    </Box>
  )
}
