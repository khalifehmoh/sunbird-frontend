import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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
import { notify } from '../../../../lib/notify'
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
import { useGetTenantsQuery } from '../../../../redux/features/tenants/tenantsApi'
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
import { isPlatformAdmin } from '../../../../hooks/useAuth'
import { useAppSelector } from '../../../../redux/store'

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
  const [searchParams, setSearchParams] = useSearchParams()
  const role = useAppSelector((state) => state.auth.role)
  const isSuperAdmin = isPlatformAdmin(role)
  const canRead = usePermissions('BRANCH:READ')
  const canCreate = usePermissions('BRANCH:CREATE')
  const canUpdate = usePermissions('BRANCH:UPDATE')
  const canDelete = usePermissions('BRANCH:DELETE')

  const [formOpened, setFormOpened] = useState(
    searchParams.get('create') === 'true' || Boolean(searchParams.get('edit')),
  )
  const [editingBranchId, setEditingBranchId] = useState<string | undefined>(
    searchParams.get('edit') ?? undefined,
  )
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebouncedValue(search, 300)
  const [filterType, setFilterType] = useState<BranchType | ''>('')
  const [filterStatus, setFilterStatus] = useState<BranchStatus | ''>('')
  const [filterTenant, setFilterTenant] = useState('')
  const [hqOnly, setHqOnly] = useState(false)
  const [sortField, setSortField] = useState<string>('branchCode')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, filterType, filterStatus, filterTenant, hqOnly])

  useEffect(() => {
    const editId = searchParams.get('edit') ?? undefined
    const shouldOpen =
      searchParams.get('create') === 'true' || Boolean(editId)
    if (shouldOpen) {
      setEditingBranchId(editId)
      setFormOpened(true)
    }
  }, [searchParams])

  function openCreateForm() {
    setEditingBranchId(undefined)
    setFormOpened(true)
  }

  function openEditForm(branchId?: string) {
    if (!branchId) return
    setEditingBranchId(branchId)
    setFormOpened(true)
  }

  function closeForm() {
    setFormOpened(false)
    setEditingBranchId(undefined)
    if (searchParams.has('create') || searchParams.has('edit')) {
      setSearchParams({}, { replace: true })
    }
  }

  const { data: tenants } = useGetTenantsQuery(
    {
      page: 0,
      size: 200,
      search: '',
      status: '',
      type: '',
      sort: 'tenantName:asc',
    },
    { skip: !isSuperAdmin },
  )

  const sortParam = `${SORT_QUERY_KEY[sortField] ?? sortField}:${sortDir}`

  const queryArgs: GetBranchesArgs = useMemo(
    () => ({
      page: page - 1,
      size: PAGE_SIZE,
      search: debouncedSearch,
      tenantId: isSuperAdmin ? filterTenant || undefined : undefined,
      status: filterStatus,
      type: filterType,
      hqOnly,
      sort: sortParam,
    }),
    [
      page,
      debouncedSearch,
      filterStatus,
      filterType,
      filterTenant,
      hqOnly,
      isSuperAdmin,
      sortParam,
    ],
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
      onConfirm: async () => {
        try {
          await patchStatus({
            branchId: row.branchId as string,
            status,
          }).unwrap()
          notify({
            type: 'success',
            title: 'Status updated',
            message: `${row.branchName} is now ${status.toLowerCase()}.`,
          })
        } catch {
          // The shared base query displays the API error.
        }
      },
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
      onConfirm: async () => {
        try {
          await deleteBranch(row.branchId as string).unwrap()
          notify({
            type: 'success',
            title: 'Branch deleted',
            message: `${row.branchName} has been deleted successfully.`,
          })
        } catch {
          // The API explains protected HQ deletion and other failures.
        }
      },
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
                onClick={openCreateForm}
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
            {isSuperAdmin ? (
              <Select
                label="Tenant"
                placeholder="All tenants"
                data={(tenants?.content ?? []).map((tenant) => ({
                  value: tenant.tenantId ?? '',
                  label: `${tenant.tenantName ?? tenant.tenantCode} (${tenant.tenantCode})`,
                }))}
                value={filterTenant}
                onChange={(value) => setFilterTenant(value ?? '')}
                clearable
                searchable
                style={{ flex: '0 1 240px', minWidth: 200 }}
              />
            ) : null}
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
          colSpan={isSuperAdmin ? 8 : 7}
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
            {isSuperAdmin ? (
              <SortTableHeader
                label="Tenant"
                field="tenantName"
                activeField={sortField}
                direction={sortDir}
                onSort={handleSort}
              />
            ) : null}
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
                style={{
                  background: row.isHeadquarters
                    ? 'var(--mantine-color-yellow-light)'
                    : undefined,
                }}
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
                {isSuperAdmin ? (
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {row.tenantName ?? row.tenantId}
                    </Text>
                  </Table.Td>
                ) : null}
                <Table.Td>
                  <Badge variant="outline" color="neutral">
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
                >
                  <Group gap={4} justify="flex-end" wrap="nowrap">
                    {canUpdate ? (
                      <Tooltip label="Edit">
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          aria-label="Edit branch"
                          onClick={() => openEditForm(row.branchId)}
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
        onClose={closeForm}
        branchId={editingBranchId}
        defaultTenantId={
          (searchParams.get('tenantId') ?? filterTenant) || undefined
        }
      />

    </Box>
  )
}
