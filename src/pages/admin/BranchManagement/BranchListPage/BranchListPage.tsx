import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BranchForm } from '../BranchForm/BranchForm'
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Menu,
  Paper,
  Select,
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
import { notifications } from '@mantine/notifications'
import {
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  MoreHorizontal,
} from 'lucide-react'
import dayjs from 'dayjs'
import {
  useDeleteBranchMutation,
  useGetBranchesQuery,
  usePatchBranchStatusMutation,
} from '../../../../redux/features/branches/branchesApi'
import type {
  BranchListItem,
  BranchStatus,
  BranchType,
  GetBranchesArgs,
} from '../../../../redux/features/branches/branchesTypes'
import {
  BRANCH_TYPE_OPTIONS,
  BRANCH_STATUS_OPTIONS,
  BRANCH_STATUS_COLORS,
} from '../branchConstants'
import { SortTableHeader } from '../../../../components/SortTableHeader/SortTableHeader'
import { StatusBadge } from '../../../../components/StatusBadge/StatusBadge'
import { DataTable } from '../../../../components/DataTable/DataTable'
import { usePermissions } from '../../../../hooks/usePermissions'

const PAGE_SIZE = 20

const SORT_QUERY_KEY: Record<string, string> = {
  branchCode: 'branchCode',
  branchName: 'branchName',
  tenantName: 'tenantName',
  branchType: 'branchType',
  city: 'city',
  status: 'status',
}

const BRANCH_TYPES: { value: BranchType | ''; label: string }[] = [
  { value: '', label: 'All types' },
  ...BRANCH_TYPE_OPTIONS,
]

const STATUSES: { value: BranchStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  ...BRANCH_STATUS_OPTIONS,
]

export function BranchListPage() {
  const navigate = useNavigate()
  const canRead = usePermissions('BRANCH:READ')
  const canCreate = usePermissions('BRANCH:CREATE')
  const canUpdate = usePermissions('BRANCH:UPDATE')
  const canDelete = usePermissions('BRANCH:DELETE')

  const [formOpened, setFormOpened] = useState(false)
  const [editingBranchId, setEditingBranchId] = useState<string | undefined>()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebouncedValue(search, 300)
  const [filterType, setFilterType] = useState<BranchType | ''>('')
  const [filterStatus, setFilterStatus] = useState<BranchStatus | ''>('')
  const [hqOnly, setHqOnly] = useState(false)
  const [sortField, setSortField] = useState<string>('branchCode')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, filterType, filterStatus, hqOnly])

  const sortParam = `${SORT_QUERY_KEY[sortField] ?? sortField}:${sortDir}`

  const queryArgs: GetBranchesArgs = useMemo(
    () => ({
      page: page - 1,
      size: PAGE_SIZE,
      search: debouncedSearch,
      status: filterStatus,
      type: filterType,
      hqOnly,
      sort: sortParam,
    }),
    [page, debouncedSearch, filterStatus, filterType, hqOnly, sortParam],
  )

  const { data, isLoading, isFetching, isError } = useGetBranchesQuery(
    queryArgs,
    { skip: !canRead },
  )

  const [deleteBranch] = useDeleteBranchMutation()
  const [patchStatus] = usePatchBranchStatusMutation()

  function handleSort(field: string) {
    if (field === sortField) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const confirmSetStatus = (row: BranchListItem, status: BranchStatus) => {
    if (status === row.status) return
    modals.openConfirmModal({
      title: 'Update branch status',
      children: (
        <Text size="sm">
          Set <strong>{row.branchName}</strong> ({row.branchCode}) to{' '}
          <strong>{status}</strong>?
        </Text>
      ),
      labels: { confirm: 'Save', cancel: 'Cancel' },
      onConfirm: () =>
        patchStatus({ branchId: row.branchId as string, status }).unwrap().then(() => {
          notifications.show({
            title: 'Status updated',
            message: `${row.branchName} is now ${status.toLowerCase()}.`,
            color: 'green',
          })
        }),
    })
  }

  const confirmDelete = (row: BranchListItem) => {
    if (!row.branchId) return
    modals.openConfirmModal({
      title: 'Delete branch',
      children: (
        <Text size="sm">
          Delete <strong>{row.branchName}</strong> ({row.branchCode})?{' '}
          {row.isHeadquarters && (
            <Text span c="orange" fw={600}>
              This is the HQ branch — ensure no other branches exist first.
            </Text>
          )}
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () =>
        deleteBranch(row.branchId as string).unwrap().then(() => {
          notifications.show({
            title: 'Branch deleted',
            message: `${row.branchName} has been deleted successfully.`,
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
        <Text>You don&apos;t have permission to view branches.</Text>
      </Box>
    )
  }

  return (
    <Box p="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Stack gap={4}>
            <Title order={2}>Branches</Title>
            <Text c="dimmed" size="sm">
              Physical locations — search, filter, and manage status.
            </Text>
          </Stack>
          <Group gap="sm">
            {canCreate ? (
              <Button
                leftSection={<Plus size={18} />}
                onClick={() => {
                  setEditingBranchId(undefined)
                  setFormOpened(true)
                }}
              >
                Create branch
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
              label="Branch type"
              data={BRANCH_TYPES}
              value={filterType}
              onChange={(v) => setFilterType((v ?? '') as BranchType | '')}
              clearable
              style={{ flex: '0 1 180px', minWidth: 160 }}
            />
            <Select
              label="Status"
              data={STATUSES}
              value={filterStatus}
              onChange={(v) => setFilterStatus((v ?? '') as BranchStatus | '')}
              clearable
              style={{ flex: '0 1 160px', minWidth: 140 }}
            />
            <Switch
              label="HQ only"
              checked={hqOnly}
              onChange={(e) => setHqOnly(e.currentTarget.checked)}
              style={{ paddingBottom: 4 }}
            />
          </Group>
        </Paper>

        {isError ? (
          <Text c="red" size="sm">
            Could not load branches. Check the API and try again.
          </Text>
        ) : null}

        <DataTable
          isLoading={isLoading}
          isFetching={isFetching}
          totalElements={data?.totalElements ?? rows.length}
          totalPages={totalPages}
          page={page}
          onPageChange={setPage}
          colSpan={8}
          minWidth={960}
          countLabel="branch(es)"
          emptyMessage="No branches match your filters."
        >
          <DataTable.Header>
            <SortTableHeader
              label="Code"
              field="branchCode"
              activeField={sortField}
              direction={sortDir}
              onSort={handleSort}
            />
            <SortTableHeader
              label="Name"
              field="branchName"
              activeField={sortField}
              direction={sortDir}
              onSort={handleSort}
            />
            <SortTableHeader
              label="Tenant"
              field="tenantName"
              activeField={sortField}
              direction={sortDir}
              onSort={handleSort}
            />
            <SortTableHeader
              label="Type"
              field="branchType"
              activeField={sortField}
              direction={sortDir}
              onSort={handleSort}
            />
            <Table.Th style={{ whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
              <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                HQ
              </Text>
            </Table.Th>
            <SortTableHeader
              label="City"
              field="city"
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
          </DataTable.Header>

          <DataTable.Body>
            {rows.map((row) => (
              <Table.Tr
                key={row.branchId}
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/admin/branches/${row.branchId}`)}
              >
                <Table.Td>
                  <Badge variant="light" color="violet" tt="uppercase">
                    {row.branchCode}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Stack gap={2}>
                    <Text size="sm" fw={500}>
                      {row.branchName}
                    </Text>
                    {row.branchNameAr ? (
                      <Text size="xs" c="dimmed" dir="rtl">
                        {row.branchNameAr}
                      </Text>
                    ) : null}
                  </Stack>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">
                    {row.tenantName ?? row.tenantId}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Badge variant="outline" color="gray">
                    {row.branchType}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  {row.isHeadquarters ? (
                    <Tooltip label="Headquarters">
                      <ActionIcon
                        variant="transparent"
                        color="yellow"
                        size="sm"
                        aria-label="HQ"
                      >
                        <Star size={16} fill="currentColor" />
                      </ActionIcon>
                    </Tooltip>
                  ) : (
                    <Text size="sm" c="dimmed">
                      —
                    </Text>
                  )}
                </Table.Td>
                <Table.Td>
                  <Stack gap={2}>
                    <Text size="sm">{row.city ?? '—'}</Text>
                    {row.updatedAt ? (
                      <Text size="xs" c="dimmed">
                        Updated {dayjs(row.updatedAt).format('MMM D, YYYY')}
                      </Text>
                    ) : null}
                  </Stack>
                </Table.Td>
                <Table.Td>
                  <StatusBadge
                    value={row.status}
                    colorMap={BRANCH_STATUS_COLORS}
                    variant="light"
                  />
                </Table.Td>
                <Table.Td
                  ta="right"
                  style={{ verticalAlign: 'middle' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Group gap={4} justify="flex-end" wrap="nowrap">
                    {canUpdate ? (
                      <Tooltip label="Edit">
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          aria-label="Edit branch"
                          onClick={() => {
                            setEditingBranchId(row.branchId)
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
                              {STATUSES.filter((s) => s.value !== '').map((s) => (
                                <Menu.Item
                                  key={s.value}
                                  disabled={row.status === s.value}
                                  onClick={() =>
                                    confirmSetStatus(row, s.value as BranchStatus)
                                  }
                                >
                                  Set {s.label}
                                </Menu.Item>
                              ))}
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
            ))}
          </DataTable.Body>
        </DataTable>
      </Stack>

      <BranchForm
        opened={formOpened}
        onClose={() => setFormOpened(false)}
        branchId={editingBranchId}
      />
    </Box>
  )
}
