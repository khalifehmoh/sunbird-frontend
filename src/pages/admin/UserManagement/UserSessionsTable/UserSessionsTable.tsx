import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Loader,
  Stack,
  Table,
  Text,
  Tooltip,
} from '@mantine/core'
import { modals } from '@mantine/modals'
import { notify } from '../../../../lib/notify'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { LogOut, Trash2 } from 'lucide-react'
import {
  useGetUserSessionsQuery,
  useTerminateAllSessionsMutation,
  useTerminateSessionMutation,
} from '../../../../redux/features/users/usersApi'
import type { UserSessionItem } from '../../../../redux/features/users/usersTypes'
import { parseUserAgent, parseOs } from '../../../../utils/userAgent'
import { usePermissions } from '../../../../hooks/usePermissions'

dayjs.extend(relativeTime)

interface UserSessionsTableProps {
  userId: string
  showHeaderActions?: boolean
}

export function UserSessionsTable({
  userId,
  showHeaderActions = true,
}: UserSessionsTableProps) {
  const canUpdate = usePermissions('USER:UPDATE')
  const { data, isLoading, isError } = useGetUserSessionsQuery(userId, {
    skip: !userId,
  })
  const [terminateSession] = useTerminateSessionMutation()
  const [terminateAll] = useTerminateAllSessionsMutation()

  const sessions = data ?? []
  const activeCount = sessions.filter((session) => session.isActive).length

  function confirmTerminate(session: UserSessionItem) {
    modals.openConfirmModal({
      title: 'Terminate session',
      children: (
        <Text size="sm">
          End the session from{' '}
          <strong>{parseUserAgent(session.userAgent)}</strong>
          {session.ipAddress ? ` (${session.ipAddress})` : ''}?
        </Text>
      ),
      labels: { confirm: 'Terminate', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await terminateSession({
            sessionId: session.sessionId,
            userId,
          }).unwrap()
          notify({
            type: 'success',
            title: 'Session terminated',
            message: 'The session was ended successfully.',
          })
        } catch {
          // Shared base query shows API errors.
        }
      },
    })
  }

  function confirmTerminateAll() {
    modals.openConfirmModal({
      title: 'Terminate all sessions',
      children: (
        <Text size="sm">
          End all active sessions for this user? They will need to sign in
          again.
        </Text>
      ),
      labels: { confirm: 'Terminate all', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          const result = await terminateAll(userId).unwrap()
          notify({
            type: 'success',
            title: 'Sessions terminated',
            message: `${result.terminated} session(s) ended.`,
          })
        } catch {
          // Shared base query shows API errors.
        }
      },
    })
  }

  if (isLoading) {
    return (
      <Group justify="center" py="xl">
        <Loader size="sm" />
      </Group>
    )
  }

  if (isError) {
    return (
      <Text c="red" size="sm">
        Could not load sessions.
      </Text>
    )
  }

  return (
    <Stack gap="md">
      {showHeaderActions ? (
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            {sessions.length} session(s) · {activeCount} active
          </Text>
          {canUpdate && activeCount > 0 ? (
            <Button
              variant="light"
              color="red"
              leftSection={<LogOut size={16} />}
              onClick={confirmTerminateAll}
            >
              Terminate all
            </Button>
          ) : null}
        </Group>
      ) : null}

      {sessions.length === 0 ? (
        <Text size="sm" c="dimmed">
          No sessions recorded for this user.
        </Text>
      ) : (
        <Box style={{ overflowX: 'auto' }}>
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Login</Table.Th>
                <Table.Th>Last activity</Table.Th>
                <Table.Th>IP</Table.Th>
                <Table.Th>Browser</Table.Th>
                <Table.Th>Expires</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th ta="right">Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sessions.map((session) => {
                const browser = parseUserAgent(session.userAgent)
                const os = parseOs(session.userAgent)
                return (
                  <Table.Tr
                    key={session.sessionId}
                    style={{
                      background: session.isActive
                        ? 'var(--mantine-color-teal-light)'
                        : undefined,
                    }}
                  >
                    <Table.Td>
                      <Text size="sm">
                        {session.loginAt
                          ? dayjs(session.loginAt).format('MMM D, YYYY h:mm A')
                          : '—'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {session.lastActivityAt
                          ? dayjs(session.lastActivityAt).fromNow()
                          : '—'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{session.ipAddress ?? '—'}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {browser}
                        {os ? ` · ${os}` : ''}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {session.expiresAt
                          ? dayjs(session.expiresAt).format('MMM D, YYYY h:mm A')
                          : '—'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        variant="light"
                        color={session.isActive ? 'teal' : 'neutral'}
                      >
                        {session.isActive ? 'Active' : 'Expired'}
                      </Badge>
                    </Table.Td>
                    <Table.Td ta="right">
                      {canUpdate && session.isActive ? (
                        <Tooltip label="Terminate">
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            aria-label="Terminate session"
                            onClick={() => confirmTerminate(session)}
                          >
                            <Trash2 size={16} />
                          </ActionIcon>
                        </Tooltip>
                      ) : null}
                    </Table.Td>
                  </Table.Tr>
                )
              })}
            </Table.Tbody>
          </Table>
        </Box>
      )}
    </Stack>
  )
}
