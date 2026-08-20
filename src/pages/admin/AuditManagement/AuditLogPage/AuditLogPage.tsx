import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { useDebouncedValue } from '@mantine/hooks'
import { Download, Eye, Search } from 'lucide-react'
import dayjs from 'dayjs'
import {
  useExportAuditLogsMutation,
  useGetAuditEventsQuery,
} from '../../../../redux/features/audit/auditApi'
import type { GetAuditArgs } from '../../../../redux/features/audit/auditTypes'
import { DataTable } from '../../../../components/DataTable/DataTable'
import { SortTableHeader } from '../../../../components/SortTableHeader/SortTableHeader'
import { usePermissions } from '../../../../hooks/usePermissions'
import { notify } from '../../../../lib/notify'
import {
  AUDIT_ACTION_OPTIONS,
  AUDIT_ENTITY_OPTIONS,
  auditActionColor,
} from '../auditConstants'

const PAGE_SIZE = 20

type DateRangeValue = [Date | null, Date | null]

export function AuditLogPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const canRead = usePermissions('AUDIT:READ')
  const canExport = usePermissions('AUDIT:EXPORT')
  const tenantId = searchParams.get('tenantId') ?? ''

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebouncedValue(search, 300)
  const [actionType, setActionType] = useState('')
  const [entityType, setEntityType] = useState('')
  const [ip, setIp] = useState('')
  const [debouncedIp] = useDebouncedValue(ip, 300)
  const [dateRange, setDateRange] = useState<DateRangeValue>([null, null])
  const [sortField, setSortField] = useState('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [exportAudit, { isLoading: exporting }] = useExportAuditLogsMutation()

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, actionType, entityType, debouncedIp, dateRange, tenantId])

  const queryArgs: GetAuditArgs = useMemo(
    () => ({
      page: page - 1,
      size: PAGE_SIZE,
      search: debouncedSearch,
      sort: `${sortField}:${sortDir}`,
      actionType: actionType || undefined,
      entityType: entityType || undefined,
      ip: debouncedIp.trim() || undefined,
      tenantId: tenantId || undefined,
      from: dateRange[0] ? dayjs(dateRange[0]).format('YYYY-MM-DD') : undefined,
      to: dateRange[1] ? dayjs(dateRange[1]).format('YYYY-MM-DD') : undefined,
    }),
    [
      page,
      debouncedSearch,
      sortField,
      sortDir,
      actionType,
      entityType,
      debouncedIp,
      tenantId,
      dateRange,
    ],
  )

  const { data, isLoading, isFetching } = useGetAuditEventsQuery(queryArgs, {
    skip: !canRead,
  })

  function toggleSort(field: string) {
    if (sortField === field) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortField(field)
    setSortDir(field === 'createdAt' ? 'desc' : 'asc')
  }

  async function handleExport() {
    try {
      await exportAudit(queryArgs).unwrap()
      notify({
        type: 'success',
        title: 'Export started',
        message: 'Audit log CSV download should begin shortly.',
      })
    } catch {
      // Shared base query shows API errors.
    }
  }

  if (!canRead) {
    return (
      <Box p="xl">
        <Text>You don&apos;t have permission to view audit logs.</Text>
      </Box>
    )
  }

  const rows = data?.content ?? []

  return (
    <Box p="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Stack gap={4}>
            <Title order={2}>Audit log</Title>
            <Text c="dimmed" size="sm">
              Immutable trail of system events. Search by user, entity, action,
              or IP.
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

        {tenantId ? (
          <Badge variant="light" color="blue" w="fit-content">
            Filtered to tenant {tenantId}
          </Badge>
        ) : null}

        <Paper withBorder radius="md" p="md">
          <Group gap="sm" wrap="wrap" align="flex-end">
            <TextInput
              placeholder="Search user, entity, or IP"
              leftSection={<Search size={16} />}
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              style={{ flex: '1 1 220px' }}
            />
            <DatePickerInput
              type="range"
              placeholder="Date range"
              value={dateRange}
              onChange={(value) => setDateRange(value as DateRangeValue)}
              clearable
              valueFormat="MMM D, YYYY"
              style={{ minWidth: 240 }}
            />
            <Select
              placeholder="Action"
              data={[...AUDIT_ACTION_OPTIONS]}
              value={actionType}
              onChange={(value) => setActionType(value ?? '')}
              clearable
              searchable
              w={180}
            />
            <Select
              placeholder="Entity"
              data={[...AUDIT_ENTITY_OPTIONS]}
              value={entityType}
              onChange={(value) => setEntityType(value ?? '')}
              clearable
              searchable
              w={160}
            />
            <TextInput
              placeholder="IP address"
              value={ip}
              onChange={(event) => setIp(event.currentTarget.value)}
              w={160}
            />
          </Group>
        </Paper>

        <DataTable
          isLoading={isLoading}
          isFetching={isFetching}
          totalElements={data?.totalElements ?? 0}
          totalPages={data?.totalPages ?? 0}
          page={page}
          onPageChange={setPage}
          colSpan={7}
          minWidth={980}
          countLabel="event(s)"
          emptyMessage="No audit events match your filters."
        >
          <DataTable.Header>
            <SortTableHeader
              label="Timestamp"
              field="createdAt"
              activeField={sortField}
              direction={sortDir}
              onSort={toggleSort}
            />
            <Table.Th>User</Table.Th>
            <SortTableHeader
              label="Action"
              field="actionType"
              activeField={sortField}
              direction={sortDir}
              onSort={toggleSort}
            />
            <Table.Th>Entity</Table.Th>
            <Table.Th>IP address</Table.Th>
            <Table.Th>Result</Table.Th>
            <Table.Th ta="right">Details</Table.Th>
          </DataTable.Header>
          <DataTable.Body>
            {rows.map((event) => (
              <Table.Tr
                key={event.auditId}
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/admin/audit/${event.auditId}`)}
              >
                <Table.Td>
                  <Text size="sm" style={{ whiteSpace: 'nowrap' }}>
                    {event.createdAt
                      ? dayjs(event.createdAt).format('MMM D, YYYY h:mm A')
                      : '—'}
                  </Text>
                </Table.Td>
                <Table.Td>
                  {event.userId ? (
                    <Text
                      size="sm"
                      component={Link}
                      to={`/admin/users/${event.userId}`}
                      onClick={(click) => click.stopPropagation()}
                      fw={500}
                    >
                      {event.username ?? event.userFullName ?? 'User'}
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
                  <Text size="sm">{event.entityName ?? '—'}</Text>
                  <Text size="xs" c="dimmed">
                    {event.entityType}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{event.ipAddress ?? '—'}</Text>
                </Table.Td>
                <Table.Td>
                  {event.success ? (
                    <Badge color="teal" variant="light">
                      Success
                    </Badge>
                  ) : (
                    <Badge color="red" variant="light">
                      Failed
                    </Badge>
                  )}
                </Table.Td>
                <Table.Td ta="right">
                  <Tooltip label="View detail">
                    <ActionIcon
                      variant="subtle"
                      aria-label="View audit detail"
                      onClick={(click) => {
                        click.stopPropagation()
                        navigate(`/admin/audit/${event.auditId}`)
                      }}
                    >
                      <Eye size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Table.Td>
              </Table.Tr>
            ))}
          </DataTable.Body>
        </DataTable>
      </Stack>
    </Box>
  )
}
