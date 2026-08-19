import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { GroupForm } from '../GroupForm/GroupForm'
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
import { useDebouncedValue } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import { notify } from '../../../../lib/notify'
import { Eye, Pencil, Plus, Search, Trash2, Users } from 'lucide-react'
import {
  useDeleteGroupMutation,
  useGetGroupsQuery,
} from '../../../../redux/features/groups/groupsApi'
import type {
  GetGroupsArgs,
  GroupListItem,
  GroupStatus,
} from '../../../../redux/features/groups/groupsTypes'
import { useGetTenantsQuery } from '../../../../redux/features/tenants/tenantsApi'
import { GROUP_STATUS_COLORS, GROUP_STATUS_OPTIONS } from '../groupConstants'
import { SortTableHeader } from '../../../../components/SortTableHeader/SortTableHeader'
import { StatusBadge } from '../../../../components/StatusBadge/StatusBadge'
import { DataTable } from '../../../../components/DataTable/DataTable'
import { usePermissions } from '../../../../hooks/usePermissions'
import { isPlatformAdmin } from '../../../../hooks/useAuth'
import { useAppSelector } from '../../../../redux/store'

const PAGE_SIZE = 20

const SORT_QUERY_KEY: Record<string, string> = {
  groupCode: 'groupCode',
  groupName: 'groupName',
  status: 'status',
  tenantName: 'tenantName',
}

const STATUSES: { value: GroupStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  ...GROUP_STATUS_OPTIONS,
]

export function GroupListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const role = useAppSelector((state) => state.auth.role)
  const isSuperAdmin = isPlatformAdmin(role)
  const canRead = usePermissions('GROUP:READ')
  const canCreate = usePermissions('GROUP:CREATE')
  const canUpdate = usePermissions('GROUP:UPDATE')
  const canDelete = usePermissions('GROUP:DELETE')

  const [formOpened, setFormOpened] = useState(
    searchParams.get('create') === 'true' || Boolean(searchParams.get('edit')),
  )
  const [editingGroupId, setEditingGroupId] = useState<string | undefined>(
    searchParams.get('edit') ?? undefined,
  )
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebouncedValue(search, 300)
  const [filterStatus, setFilterStatus] = useState<GroupStatus | ''>('')
  const [filterTenant, setFilterTenant] = useState('')
  const [sortField, setSortField] = useState('groupCode')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, filterStatus, filterTenant])

  useEffect(() => {
    const editId = searchParams.get('edit') ?? undefined
    const shouldOpen =
      searchParams.get('create') === 'true' || Boolean(editId)
    if (shouldOpen) {
      setEditingGroupId(editId)
      setFormOpened(true)
    }
  }, [searchParams])

  function openCreateForm() {
    setEditingGroupId(undefined)
    setFormOpened(true)
  }

  function openEditForm(groupId?: string) {
    if (!groupId) return
    setEditingGroupId(groupId)
    setFormOpened(true)
  }

  function closeForm() {
    setFormOpened(false)
    setEditingGroupId(undefined)
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

  const queryArgs: GetGroupsArgs = useMemo(
    () => ({
      page: page - 1,
      size: PAGE_SIZE,
      search: debouncedSearch,
      status: filterStatus,
      tenantId: isSuperAdmin ? filterTenant || undefined : undefined,
      sort: sortParam,
    }),
    [
      page,
      debouncedSearch,
      filterStatus,
      filterTenant,
      isSuperAdmin,
      sortParam,
    ],
  )

  const { data, isLoading, isFetching, isError } = useGetGroupsQuery(
    queryArgs,
    { skip: !canRead },
  )

  const [deleteGroup] = useDeleteGroupMutation()

  function handleSort(field: string) {
    if (field === sortField) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const confirmDelete = (row: GroupListItem) => {
    modals.openConfirmModal({
      title: 'Delete group',
      children: (
        <Text size="sm">
          Delete <strong>{row.groupName}</strong> ({row.groupCode})? This will
          also remove membership for{' '}
          <strong>
            {row.memberCount} member{row.memberCount === 1 ? '' : 's'}
          </strong>
          .
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await deleteGroup(row.groupId).unwrap()
          notify({
            type: 'success',
            title: 'Group deleted',
            message: `${row.groupName} has been deleted.`,
          })
        } catch {
          // Shared base query shows API errors.
        }
      },
    })
  }

  const rows = data?.content ?? []
  const totalPages = Math.max(1, data?.totalPages ?? 1)

  if (!canRead) {
    return (
      <Box p="xl">
        <Text>You don&apos;t have permission to view groups.</Text>
      </Box>
    )
  }

  return (
    <Box p="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Stack gap={4}>
            <Title order={2}>Groups</Title>
            <Text c="dimmed" size="sm">
              Tenant groups for bulk role assignment.
            </Text>
          </Stack>
          {canCreate ? (
            <Button leftSection={<Plus size={18} />} onClick={openCreateForm}>
              Create group
            </Button>
          ) : null}
        </Group>

        <Paper withBorder p="md" radius="md">
          <Group align="flex-end" wrap="wrap" gap="md">
            <TextInput
              label="Search"
              placeholder="Name or code"
              leftSection={<Search size={16} />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              style={{ flex: 1, minWidth: 220 }}
            />
            <Select
              label="Status"
              data={STATUSES}
              value={filterStatus}
              onChange={(v) => setFilterStatus((v ?? '') as GroupStatus | '')}
              allowDeselect={false}
              w={160}
            />
            {isSuperAdmin ? (
              <Select
                label="Tenant"
                placeholder="All tenants"
                searchable
                clearable
                data={(tenants?.content ?? []).map((tenant) => ({
                  value: tenant.tenantId ?? '',
                  label: tenant.tenantName ?? tenant.tenantCode,
                }))}
                value={filterTenant || null}
                onChange={(v) => setFilterTenant(v ?? '')}
                w={220}
              />
            ) : null}
          </Group>
        </Paper>

        {isError ? (
          <Text c="red" size="sm">
            Could not load groups. Check the API and try again.
          </Text>
        ) : null}

        <DataTable
          isLoading={isLoading}
          isFetching={isFetching}
          totalElements={data?.totalElements ?? rows.length}
          totalPages={totalPages}
          page={page}
          onPageChange={setPage}
          colSpan={isSuperAdmin ? 7 : 6}
          minWidth={900}
          countLabel="group(s)"
          emptyMessage="No groups match the current filters."
        >
          <DataTable.Header>
            <SortTableHeader
              label="Code"
              field="groupCode"
              activeField={sortField}
              direction={sortDir}
              onSort={handleSort}
            />
            <SortTableHeader
              label="Name"
              field="groupName"
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
            <Table.Th>
              <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                Members
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                Roles
              </Text>
            </Table.Th>
            <SortTableHeader
              label="Status"
              field="status"
              activeField={sortField}
              direction={sortDir}
              onSort={handleSort}
            />
            <Table.Th ta="right">
              <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                Actions
              </Text>
            </Table.Th>
          </DataTable.Header>

          <DataTable.Body>
            {rows.map((row) => (
              <Table.Tr
                key={row.groupId}
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/admin/groups/${row.groupId}`)}
              >
                <Table.Td>
                  <Badge variant="light" color="violet" tt="uppercase">
                    {row.groupCode}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Stack gap={2}>
                    <Text size="sm" fw={500}>
                      {row.groupName}
                    </Text>
                    {row.groupNameAr ? (
                      <Text size="xs" c="dimmed" dir="rtl">
                        {row.groupNameAr}
                      </Text>
                    ) : null}
                  </Stack>
                </Table.Td>
                {isSuperAdmin ? (
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {row.tenantName ?? '—'}
                    </Text>
                  </Table.Td>
                ) : null}
                <Table.Td onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="subtle"
                    size="compact-sm"
                    leftSection={<Users size={14} />}
                    component={Link}
                    to={`/admin/groups/${row.groupId}?tab=members`}
                  >
                    {row.memberCount}
                  </Button>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{row.roleCount}</Text>
                </Table.Td>
                <Table.Td>
                  <StatusBadge
                    value={row.status}
                    colorMap={GROUP_STATUS_COLORS}
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
                        aria-label="View group"
                        component={Link}
                        to={`/admin/groups/${row.groupId}`}
                      >
                        <Eye size={18} />
                      </ActionIcon>
                    </Tooltip>
                    {canUpdate ? (
                      <Tooltip label="Edit">
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          aria-label="Edit group"
                          onClick={() => openEditForm(row.groupId)}
                        >
                          <Pencil size={18} />
                        </ActionIcon>
                      </Tooltip>
                    ) : null}
                    {canDelete ? (
                      <Tooltip label="Delete">
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          aria-label="Delete group"
                          onClick={() => confirmDelete(row)}
                        >
                          <Trash2 size={18} />
                        </ActionIcon>
                      </Tooltip>
                    ) : null}
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </DataTable.Body>
        </DataTable>
      </Stack>

      <GroupForm
        opened={formOpened}
        onClose={closeForm}
        groupId={editingGroupId}
        defaultTenantId={
          (searchParams.get('tenantId') ?? filterTenant) || undefined
        }
      />
    </Box>
  )
}
