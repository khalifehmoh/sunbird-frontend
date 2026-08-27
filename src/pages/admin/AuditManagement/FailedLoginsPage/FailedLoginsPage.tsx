import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ActionIcon,
  Box,
  Button,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
  Tooltip,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { modals } from '@mantine/modals'
import { Download, Globe, Lock, ShieldAlert, Unlock, UserRound, UserX } from 'lucide-react'
import dayjs from 'dayjs'
import { StatCard } from '../../../../components/StatCard/StatCard'
import { DataTable } from '../../../../components/DataTable/DataTable'
import { usePermissions } from '../../../../hooks/usePermissions'
import { Permission } from '../../../../constants/permissions'
import { notify } from '../../../../lib/notify'
import {
  useExportAuditLogsMutation,
  useGetAuditEventsQuery,
  useGetFailedLoginSummaryQuery,
} from '../../../../redux/features/audit/auditApi'
import type { GetAuditArgs } from '../../../../redux/features/audit/auditTypes'
import { usePatchUserStatusMutation } from '../../../../redux/features/users/usersApi'

const PAGE_SIZE = 20

type DateRangeValue = [Date | null, Date | null]

function defaultRange(): DateRangeValue {
  const to = new Date()
  const from = new Date(Date.now() - 24 * 60 * 60 * 1000)
  return [from, to]
}

function isLocked(until: string | null, status: string | null): boolean {
  if (status === 'LOCKED') return true
  if (!until) return false
  return new Date(until).getTime() > Date.now()
}

export function FailedLoginsPage() {
  const canRead = usePermissions('AUDIT:READ')
  const canExport = usePermissions('AUDIT:EXPORT')
  const canUpdateUser = usePermissions(Permission.USER_UPDATE)
  const canReadUser = usePermissions(Permission.USER_READ)

  const [page, setPage] = useState(1)
  const [dateRange, setDateRange] = useState<DateRangeValue>(defaultRange)
  const [exportAudit, { isLoading: exporting }] = useExportAuditLogsMutation()
  const [patchStatus] = usePatchUserStatusMutation()

  useEffect(() => {
    setPage(1)
  }, [dateRange])

  const from = dateRange[0]?.toISOString()
  const to = dateRange[1]?.toISOString()

  const queryArgs: GetAuditArgs = useMemo(
    () => ({
      page: page - 1,
      size: PAGE_SIZE,
      sort: 'createdAt:desc',
      search: '',
      actionType: 'FAILED_LOGIN',
      from,
      to,
    }),
    [page, from, to],
  )

  const { data, isLoading, isFetching, refetch } = useGetAuditEventsQuery(
    queryArgs,
    { skip: !canRead },
  )
  const { data: summary, isLoading: summaryLoading } =
    useGetFailedLoginSummaryQuery(
      { from, to },
      { skip: !canRead },
    )

  const flagged = new Set(summary?.flaggedIps ?? [])
  const rows = data?.content ?? []

  async function handleExport() {
    try {
      await exportAudit(queryArgs).unwrap()
      notify({
        type: 'success',
        title: 'Export started',
        message: 'Failed login CSV download should begin shortly.',
      })
    } catch {
      // Shared base query shows API errors.
    }
  }

  function confirmUnlock(userId: string, username: string | null) {
    modals.openConfirmModal({
      title: 'Unlock account',
      children: (
        <Text size="sm">
          Unlock {username ?? 'this account'} and reset failed login attempts?
        </Text>
      ),
      labels: { confirm: 'Unlock', cancel: 'Cancel' },
      confirmProps: { color: 'teal' },
      onConfirm: async () => {
        try {
          await patchStatus({ userId, status: 'ACTIVE' }).unwrap()
          notify({
            type: 'success',
            title: 'Account unlocked',
            message: `${username ?? 'User'} can sign in again.`,
          })
          void refetch()
        } catch {
          // Shared base query shows API errors.
        }
      },
    })
  }

  if (!canRead) {
    return (
      <Box p="xl">
        <Text>You don&apos;t have permission to view failed logins.</Text>
      </Box>
    )
  }

  return (
    <Box p="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Stack gap={4}>
            <Title order={2}>Failed login report</Title>
            <Text c="dimmed" size="sm">
              FAILED_LOGIN events. IPs with more than 5 attempts in range are
              highlighted red.
            </Text>
          </Stack>
          {canExport ? (
            <Button
              variant="light"
              leftSection={<Download size={18} />}
              loading={exporting}
              onClick={() => void handleExport()}
            >
              Export
            </Button>
          ) : null}
        </Group>

        <SimpleGrid cols={{ base: 1, xs: 3 }} spacing="md">
          <StatCard
            label="Total failed (range)"
            value={summary?.totalFailed}
            icon={<ShieldAlert size={26} />}
            color="orange"
            loading={summaryLoading}
          />
          <StatCard
            label="Unique IPs"
            value={summary?.uniqueIps}
            icon={<Globe size={26} />}
            color="violet"
            loading={summaryLoading}
          />
          <StatCard
            label="Locked accounts"
            value={summary?.lockedAccounts}
            icon={<UserX size={26} />}
            color="red"
            loading={summaryLoading}
          />
        </SimpleGrid>

        <Paper withBorder radius="md" p="md">
          <DatePickerInput
            type="range"
            label="Date range"
            value={dateRange}
            onChange={(value) => setDateRange(value as DateRangeValue)}
            valueFormat="MMM D, YYYY HH:mm"
            clearable={false}
            maw={360}
          />
        </Paper>

        <DataTable
          isLoading={isLoading}
          isFetching={isFetching}
          totalElements={data?.totalElements ?? 0}
          totalPages={data?.totalPages ?? 0}
          page={page}
          onPageChange={setPage}
          colSpan={8}
          minWidth={1100}
          countLabel="failed attempt(s)"
          emptyMessage="No failed logins in this range."
        >
          <DataTable.Header>
            <Table.Th>Timestamp</Table.Th>
            <Table.Th>Username tried</Table.Th>
            <Table.Th>User</Table.Th>
            <Table.Th>IP address</Table.Th>
            <Table.Th>Attempts</Table.Th>
            <Table.Th>Account locked</Table.Th>
            <Table.Th>Error</Table.Th>
            <Table.Th ta="right">Actions</Table.Th>
          </DataTable.Header>
          <DataTable.Body>
            {rows.map((event) => {
              const locked = isLocked(
                event.accountLockedUntil,
                event.targetUserStatus,
              )
              const hotIp = event.ipAddress
                ? flagged.has(event.ipAddress)
                : false
              return (
                <Table.Tr key={event.auditId}>
                  <Table.Td>
                    <Text size="sm" style={{ whiteSpace: 'nowrap' }}>
                      {event.createdAt
                        ? dayjs(event.createdAt).format('MMM D, YYYY h:mm A')
                        : '—'}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={500}>
                      {event.entityName ?? '—'}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    {event.userId ? (
                      <Text
                        size="sm"
                        component={Link}
                        to={`/admin/users/${event.userId}`}
                      >
                        {event.userFullName ?? event.username}
                      </Text>
                    ) : (
                      <Text size="sm" c="dimmed" fs="italic">
                        Unknown user
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Text
                      size="sm"
                      c={hotIp ? 'red' : undefined}
                      fw={hotIp ? 700 : 400}
                    >
                      {event.ipAddress ?? '—'}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">
                      {event.failedLoginAttempts ?? '—'}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    {locked ? (
                      <Group gap={6} wrap="nowrap">
                        <Lock size={14} color="var(--mantine-color-red-6)" />
                        <Text size="sm" c="red">
                          {event.accountLockedUntil
                            ? dayjs(event.accountLockedUntil).format(
                                'MMM D, h:mm A',
                              )
                            : 'Locked'}
                        </Text>
                      </Group>
                    ) : (
                      <Text size="sm" c="dimmed">
                        —
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" lineClamp={2}>
                      {event.errorMessage ?? '—'}
                    </Text>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Group gap={4} justify="flex-end">
                      {canReadUser && event.userId ? (
                        <Tooltip label="View user">
                          <ActionIcon
                            component={Link}
                            to={`/admin/users/${event.userId}`}
                            variant="subtle"
                            aria-label="View user"
                          >
                            <UserRound size={16} />
                          </ActionIcon>
                        </Tooltip>
                      ) : null}
                      {canUpdateUser && event.userId && locked ? (
                        <Tooltip label="Unlock account">
                          <ActionIcon
                            variant="subtle"
                            color="teal"
                            aria-label="Unlock account"
                            onClick={() =>
                              confirmUnlock(
                                event.userId as string,
                                event.username ?? event.entityName,
                              )
                            }
                          >
                            <Unlock size={16} />
                          </ActionIcon>
                        </Tooltip>
                      ) : null}
                    </Group>
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
