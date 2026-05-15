import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TenantForm } from '../TenantForm/TenantForm'
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Menu,
  Pagination,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import {
  Download,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import dayjs from 'dayjs'
import {
  useDeleteTenantMutation,
  useGetTenantsQuery,
} from '../../../../redux/features/tenants/tenantsApi'
import type {
  OrganizationType,
  TenantListItem,
  TenantStatus,
  GetTenantsArgs,
} from '../../../../redux/features/tenants/tenantsTypes'
import {
  ORG_TYPE_OPTIONS,
  TENANT_STATUS_OPTIONS,
  TENANT_STATUS_COLORS,
} from '../tenantConstants'
import { SortTableHeader } from '../../../../components/SortTableHeader/SortTableHeader'
import { StatusBadge } from '../../../../components/StatusBadge/StatusBadge'
import { usePermissions } from '../../../../hooks/usePermissions'

const PAGE_SIZE = 20

/** Backend sort field names (Spring Data style); adjust if your API differs */
const SORT_QUERY_KEY: Record<string, string> = {
  tenantCode: 'tenantCode',
  tenantName: 'tenantName',
  organizationType: 'organizationType',
  licenseNumber: 'licenseNumber',
  maxUsers: 'maxUsers',
  status: 'status',
}

const ORG_TYPES: { value: OrganizationType | ''; label: string }[] = [
  { value: '', label: 'All types' },
  ...ORG_TYPE_OPTIONS,
]

const STATUSES: { value: TenantStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  ...TENANT_STATUS_OPTIONS,
]

export function TenantListPage() {
  const navigate = useNavigate()
  const canRead = usePermissions('TENANT:READ')
  const canCreate = usePermissions('TENANT:CREATE')
  const canUpdate = usePermissions('TENANT:UPDATE')
  const canDelete = usePermissions('TENANT:DELETE')
  const canExport = usePermissions('TENANT:EXPORT')

  const [formOpened, setFormOpened] = useState(false)
  const [editingTenantId, setEditingTenantId] = useState<string | undefined>()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebouncedValue(search, 300)
  const [filterType, setFilterType] = useState<OrganizationType | ''>('')
  const [filterStatus, setFilterStatus] = useState<TenantStatus | ''>('')
  const [sortField, setSortField] = useState<string>('tenantCode')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, filterType, filterStatus])

  const sortParam = `${SORT_QUERY_KEY[sortField] ?? sortField}:${sortDir}`

  const queryArgs: GetTenantsArgs = useMemo(
    () => ({
      page: page - 1,
      size: PAGE_SIZE,
      search: debouncedSearch,
      status: filterStatus as TenantStatus | '',
      type: filterType as OrganizationType | '',
      sort: sortParam,
    }),
    [page, debouncedSearch, filterStatus, filterType, sortParam],
  )

  const { data, isLoading, isFetching, isError } = useGetTenantsQuery(
    queryArgs,
    { skip: !canRead },
  )

  const [deleteTenant] = useDeleteTenantMutation()

  function handleSort(field: string) {
    if (field === sortField) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  // const confirmSetStatus = (row: TenantListItem, status: TenantStatus) => {
  //   if (status === row.status) return
  //   modals.openConfirmModal({
  //     title: 'Update tenant status',
  //     children: (
  //       <Text size="sm">
  //         Set <strong>{row.tenantName}</strong> ({row.tenantCode}) to{' '}
  //         <strong>{status}</strong>?
  //       </Text>
  //     ),
  //     labels: { confirm: 'Save', cancel: 'Cancel' },
  //     // onConfirm: () => patchStatus({ tenantId: row.tenantId, status }),
  //   })
  // }

  const confirmDelete = (row: TenantListItem) => {
    if (!row.tenantId) return
    modals.openConfirmModal({
      title: 'Delete tenant',
      children: (
        <Text size="sm">
          Delete <strong>{row.tenantName}</strong> ({row.tenantCode})?
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => deleteTenant(row.tenantId as string).unwrap().then(() => {
        notifications.show({
          title: 'Tenant deleted',
          message: `${row.tenantName} has been deleted successfully.`,
          color: 'green',
        })
      }),
    })
  }

  const rows = data?.content ?? []
  const totalPages = Math.max(1, data?.totalPages ?? 1)

  if (!canRead) {
    return (
      <Box p="xl">
        <Text>You don&apos;t have permission to view tenants.</Text>
      </Box>
    )
  }

  return (
    <Box p="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Stack gap={4}>
            <Title order={2}>Tenants</Title>
            <Text c="dimmed" size="sm">
              Organizations on the platform — search, filter, and manage status.
            </Text>
          </Stack>
          <Group gap="sm">
            {canExport ? (
              <Tooltip label="CSV export uses current filters once the backend endpoint exists">
                <Button
                  variant="light"
                  leftSection={<Download size={18} />}
                  onClick={() =>
                    notifications.show({
                      title: 'Export',
                      message:
                        'Wire GET /tenants/export (or equivalent) to download CSV with the active filters.',
                      color: 'blue',
                    })
                  }
                >
                  Export
                </Button>
              </Tooltip>
            ) : null}
            {canCreate ? (
              <Button
                leftSection={<Plus size={18} />}
                onClick={() => {
                  setEditingTenantId(undefined)
                  setFormOpened(true)
                }}
              >
                Create tenant
              </Button>
            ) : null}
          </Group>
        </Group>

        <Paper withBorder p="md" radius="md">
          <Group align="flex-end" wrap="wrap" gap="md">
            <TextInput
              label="Search"
              placeholder="Name or code"
              leftSection={<Search size={16} />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              style={{ flex: '1 1 220px', minWidth: 200 }}
            />
            <Select
              label="Organization type"
              data={ORG_TYPES}
              value={filterType}
              onChange={(v) => setFilterType((v ?? '') as OrganizationType | '')}
              clearable
              style={{ flex: '0 1 180px', minWidth: 160 }}
            />
            <Select
              label="Status"
              data={STATUSES}
              value={filterStatus}
              onChange={(v) => setFilterStatus((v ?? '') as TenantStatus | '')}
              clearable
              style={{ flex: '0 1 160px', minWidth: 140 }}
            />
          </Group>
        </Paper>

        {isError ? (
          <Text c="red" size="sm">
            Could not load tenants. Check the API and try again.
          </Text>
        ) : null}

        <Paper withBorder radius="md">
          <Box
            style={{
              width: '100%',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {/* TODO: Refactor this to use the new table component */}
            <Table striped highlightOnHover verticalSpacing="sm" style={{ minWidth: 920 }}>
              <Table.Thead>
                <Table.Tr>
                  <SortTableHeader
                    label="Code"
                    field="tenantCode"
                    activeField={sortField}
                    direction={sortDir}
                    onSort={handleSort}
                  />
                  <SortTableHeader
                    label="Organization"
                    field="tenantName"
                    activeField={sortField}
                    direction={sortDir}
                    onSort={handleSort}
                  />
                  <SortTableHeader
                    label="Type"
                    field="organizationType"
                    activeField={sortField}
                    direction={sortDir}
                    onSort={handleSort}
                  />
                  <SortTableHeader
                    label="License"
                    field="licenseNumber"
                    activeField={sortField}
                    direction={sortDir}
                    onSort={handleSort}
                  />
                  <SortTableHeader
                    label="Max users"
                    field="maxUsers"
                    activeField={sortField}
                    direction={sortDir}
                    onSort={handleSort}
                  />
                  <SortTableHeader
                    label="Status"
                    field="status"
                    activeField={sortField}
                    direction={sortDir}
                    onSort={handleSort}
                  />
                  <Table.Th
                    ta="right"
                    style={{ width: '1%', whiteSpace: 'nowrap', verticalAlign: 'middle' }}
                  >
                    <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                      Actions
                    </Text>
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <Table.Tr key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <Table.Td key={j}>
                          <Skeleton height={20} radius="sm" />
                        </Table.Td>
                      ))}
                    </Table.Tr>
                  ))
                ) : rows.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={7}>
                      <Text ta="center" c="dimmed" py="xl">
                        No tenants match your filters.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  rows.map((row) => {
                    return (
                      <Table.Tr
                        key={row.tenantId}
                        style={{ cursor: 'pointer' }}
                        onClick={() =>
                          navigate(`/admin/tenants/${row.tenantId}`)
                        }
                      >
                        <Table.Td>
                          <Badge variant="light" color="blue" tt="uppercase">
                            {row.tenantCode}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Stack gap={2}>
                            <Text size="sm" fw={500}>
                              {row.tenantName}
                            </Text>
                          </Stack>
                        </Table.Td>
                        <Table.Td>
                          <Badge variant="outline" color="gray">
                            {row.organizationType}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Stack gap={4}>
                            <Text size="sm" ff="monospace">
                              {row.licenseNumber ?? '—'}
                            </Text>
                            {row.updatedAt ? (
                              <Text size="xs" c="dimmed">
                                Updated{' '}
                                {dayjs(row.updatedAt).format('MMM D, YYYY')}
                              </Text>
                            ) : null}
                          </Stack>
                        </Table.Td>
                        <Table.Td>
                          <Stack gap={2}>
                            <Text size="sm" fw={500}>
                              {row.maxUsers}
                            </Text>
                            <Text size="xs" c="dimmed">
                              seat limit
                            </Text>
                          </Stack>
                        </Table.Td>
                        <Table.Td>
                          <StatusBadge
                            value={row.status}
                            colorMap={TENANT_STATUS_COLORS}
                            variant="light"
                          />
                        </Table.Td>
                        <Table.Td
                          ta="right"
                          style={{ verticalAlign: 'middle' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Group gap={4} justify="flex-end" wrap="nowrap">
                            <Tooltip label="View">
                              <ActionIcon
                                variant="subtle"
                                color="gray"
                                aria-label="View tenant"
                                component={Link}
                                to={`/admin/tenants/${row.tenantId}`}
                              >
                                <Eye size={18} />
                              </ActionIcon>
                            </Tooltip>
                            {canUpdate ? (
                              <Tooltip label="Edit">
                                <ActionIcon
                                  variant="subtle"
                                  color="gray"
                                  aria-label="Edit tenant"
                                  onClick={() => {
                                    setEditingTenantId(row.tenantId)
                                    setFormOpened(true)
                                  }}
                                >
                                  <Pencil size={18} />
                                </ActionIcon>
                              </Tooltip>
                            ) : null}
                            {(canUpdate || canDelete) && (
                              <Menu shadow="md" width={200}>
                                <Menu.Target>
                                  <ActionIcon
                                    variant="subtle"
                                    color="gray"
                                    aria-label="More actions"
                                  >
                                    <MoreHorizontal size={18} />
                                  </ActionIcon>
                                </Menu.Target>
                                <Menu.Dropdown>
                                  {canUpdate ? (
                                    <>
                                      <Menu.Label>Status</Menu.Label>
                                      {STATUSES.filter((s) => s.value !== '').map(
                                        (s) => (
                                          <Menu.Item
                                            key={s.value}
                                            disabled={row.status === s.value}
                                            // onClick={() =>
                                            //   confirmSetStatus(
                                            //     row,
                                            //     s.value as TenantStatus,
                                            //   )
                                            // }
                                          >
                                            Set {s.label}
                                          </Menu.Item>
                                        ),
                                      )}
                                    </>
                                  ) : null}
                                  {canDelete ? (
                                    <>
                                      <Menu.Divider />
                                      <Menu.Item
                                        color="red"
                                        leftSection={<Trash2 size={14} />}
                                        onClick={() => confirmDelete(row)}
                                      >
                                        Delete
                                      </Menu.Item>
                                    </>
                                  ) : null}
                                </Menu.Dropdown>
                              </Menu>
                            )}
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    )
                  })
                )}
              </Table.Tbody>
            </Table>
          </Box>

          {!isLoading && rows.length > 0 ? (
            <Group justify="space-between" p="md" pt="xs">
              <Text size="sm" c="dimmed">
                {data?.totalElements ?? rows.length} tenant(s)
                {isFetching ? ' · Updating…' : null}
              </Text>
              <Pagination
                total={totalPages}
                value={page}
                onChange={setPage}
                size="sm"
                siblings={1}
              />
            </Group>
          ) : null}
        </Paper>
      </Stack>

      <TenantForm
        opened={formOpened}
        onClose={() => setFormOpened(false)}
        tenantId={editingTenantId}
      />
    </Box>
  )
}
