import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { RoleForm } from '../RoleForm/RoleForm'
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
import { KeyRound, Lock, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import {
  useDeleteRoleMutation,
  useGetRolesQuery,
} from '../../../../redux/features/roles/rolesApi'
import type {
  GetRolesArgs,
  RoleListItem,
  RoleStatus,
} from '../../../../redux/features/roles/rolesTypes'
import {
  ROLE_STATUS_COLORS,
  ROLE_STATUS_OPTIONS,
  isRoleLocked,
  roleLockReason,
} from '../roleConstants'
import { SortTableHeader } from '../../../../components/SortTableHeader/SortTableHeader'
import { StatusBadge } from '../../../../components/StatusBadge/StatusBadge'
import { DataTable } from '../../../../components/DataTable/DataTable'
import { usePermissions } from '../../../../hooks/usePermissions'
import { isPlatformAdmin } from '../../../../hooks/useAuth'
import { useAppSelector } from '../../../../redux/store'

const PAGE_SIZE = 20

const SORT_QUERY_KEY: Record<string, string> = {
  roleCode: 'roleCode',
  roleName: 'roleName',
  status: 'status',
  tenantName: 'tenantName',
}

const STATUSES: { value: RoleStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  ...ROLE_STATUS_OPTIONS,
]

const TYPE_FILTERS: { value: '' | 'true' | 'false'; label: string }[] = [
  { value: '', label: 'All types' },
  { value: 'true', label: 'System' },
  { value: 'false', label: 'Custom' },
]

export function RoleListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const role = useAppSelector((state) => state.auth.role)
  const isSuperAdmin = isPlatformAdmin(role)
  const canRead = usePermissions('ROLE:READ')
  const canCreate = usePermissions('ROLE:CREATE')
  const canUpdate = usePermissions('ROLE:UPDATE')
  const canDelete = usePermissions('ROLE:DELETE')

  const [formOpened, setFormOpened] = useState(
    searchParams.get('create') === 'true' || Boolean(searchParams.get('edit')),
  )
  const [editingRoleId, setEditingRoleId] = useState<string | undefined>(
    searchParams.get('edit') ?? undefined,
  )
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebouncedValue(search, 300)
  const [filterStatus, setFilterStatus] = useState<RoleStatus | ''>('')
  const [filterType, setFilterType] = useState<'' | 'true' | 'false'>('')
  const [sortField, setSortField] = useState('roleCode')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, filterStatus, filterType])

  useEffect(() => {
    const editId = searchParams.get('edit') ?? undefined
    const shouldOpen =
      searchParams.get('create') === 'true' || Boolean(editId)
    if (shouldOpen) {
      setEditingRoleId(editId)
      setFormOpened(true)
    }
  }, [searchParams])

  function openCreateForm() {
    setEditingRoleId(undefined)
    setFormOpened(true)
  }

  function openEditForm(roleId?: string) {
    if (!roleId) return
    setEditingRoleId(roleId)
    setFormOpened(true)
  }

  function closeForm() {
    setFormOpened(false)
    setEditingRoleId(undefined)
    if (searchParams.has('create') || searchParams.has('edit')) {
      setSearchParams({}, { replace: true })
    }
  }

  const sortParam = `${SORT_QUERY_KEY[sortField] ?? sortField}:${sortDir}`

  const queryArgs: GetRolesArgs = useMemo(
    () => ({
      page: page - 1,
      size: PAGE_SIZE,
      search: debouncedSearch,
      status: filterStatus,
      isSystem: filterType === '' ? '' : filterType === 'true',
      sort: sortParam,
    }),
    [page, debouncedSearch, filterStatus, filterType, sortParam],
  )

  const { data, isLoading, isFetching, isError } = useGetRolesQuery(
    queryArgs,
    { skip: !canRead },
  )

  const [deleteRole] = useDeleteRoleMutation()

  function handleSort(field: string) {
    if (field === sortField) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const confirmDelete = (row: RoleListItem) => {
    modals.openConfirmModal({
      title: 'Delete role',
      children: (
        <Text size="sm">
          Delete <strong>{row.roleName}</strong> ({row.roleCode})? This role is
          assigned to{' '}
          <strong>
            {row.userCount} user{row.userCount === 1 ? '' : 's'}
          </strong>{' '}
          and{' '}
          <strong>
            {row.groupCount} group{row.groupCount === 1 ? '' : 's'}
          </strong>
          .
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await deleteRole(row.roleId).unwrap()
          notify({
            type: 'success',
            title: 'Role deleted',
            message: `${row.roleName} has been deleted.`,
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
        <Text>You don&apos;t have permission to view roles.</Text>
      </Box>
    )
  }

  return (
    <Box p="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Stack gap={4}>
            <Title order={2}>Roles</Title>
            <Text c="dimmed" size="sm">
              System-wide and tenant-specific roles for RBAC.
            </Text>
          </Stack>
          {canCreate ? (
            <Button leftSection={<Plus size={18} />} onClick={openCreateForm}>
              Create role
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
              label="Type"
              data={TYPE_FILTERS}
              value={filterType}
              onChange={(v) =>
                setFilterType((v ?? '') as '' | 'true' | 'false')
              }
              allowDeselect={false}
              w={160}
            />
            <Select
              label="Status"
              data={STATUSES}
              value={filterStatus}
              onChange={(v) => setFilterStatus((v ?? '') as RoleStatus | '')}
              allowDeselect={false}
              w={160}
            />
          </Group>
        </Paper>

        {isError ? (
          <Text c="red" size="sm">
            Could not load roles. Check the API and try again.
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
          minWidth={960}
          countLabel="role(s)"
          emptyMessage="No roles match the current filters."
        >
          <DataTable.Header>
            <SortTableHeader
              label="Code"
              field="roleCode"
              activeField={sortField}
              direction={sortDir}
              onSort={handleSort}
            />
            <SortTableHeader
              label="Name"
              field="roleName"
              activeField={sortField}
              direction={sortDir}
              onSort={handleSort}
            />
            <Table.Th>
              <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                Type
              </Text>
            </Table.Th>
            {isSuperAdmin ? (
              <SortTableHeader
                label="Scope"
                field="tenantName"
                activeField={sortField}
                direction={sortDir}
                onSort={handleSort}
              />
            ) : null}
            <Table.Th>
              <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                Permissions
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
              <Table.Tr key={row.roleId}>
                <Table.Td>
                  <Group gap={6} wrap="nowrap">
                    {row.isSystemRole ? (
                      <Tooltip label={roleLockReason(row)}>
                        <Lock size={14} />
                      </Tooltip>
                    ) : null}
                    <Badge
                      variant="light"
                      color={row.isSystemRole ? 'blue' : 'gray'}
                      tt="uppercase"
                    >
                      {row.roleCode}
                    </Badge>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Stack gap={2}>
                    <Text size="sm" fw={500}>
                      {row.roleName}
                    </Text>
                    {row.roleNameAr ? (
                      <Text size="xs" c="dimmed" dir="rtl">
                        {row.roleNameAr}
                      </Text>
                    ) : null}
                  </Stack>
                </Table.Td>
                <Table.Td>
                  <Badge
                    variant="light"
                    color={row.isSystemRole ? 'blue' : 'gray'}
                  >
                    {row.isSystemRole ? 'SYSTEM' : 'CUSTOM'}
                  </Badge>
                </Table.Td>
                {isSuperAdmin ? (
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {row.tenantName ?? 'Global'}
                    </Text>
                  </Table.Td>
                ) : null}
                <Table.Td>
                  <Button
                    variant="subtle"
                    size="compact-sm"
                    component={Link}
                    to={`/admin/roles/${row.roleId}/permissions`}
                  >
                    {row.permissionCount}
                  </Button>
                </Table.Td>
                <Table.Td>
                  <StatusBadge
                    value={row.status}
                    colorMap={ROLE_STATUS_COLORS}
                    variant="light"
                  />
                </Table.Td>
                <Table.Td ta="right" style={{ verticalAlign: 'middle' }}>
                  <Group gap={4} justify="flex-end" wrap="nowrap">
                    <Tooltip label="View permissions">
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        aria-label="View role permissions"
                        component={Link}
                        to={`/admin/roles/${row.roleId}/permissions`}
                      >
                        <KeyRound size={18} />
                      </ActionIcon>
                    </Tooltip>
                    {canUpdate ? (
                      <Tooltip
                        label={
                          isRoleLocked(row, isSuperAdmin)
                            ? roleLockReason(row)
                            : 'Edit'
                        }
                      >
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          aria-label="Edit role"
                          disabled={isRoleLocked(row, isSuperAdmin)}
                          onClick={() => openEditForm(row.roleId)}
                        >
                          <Pencil size={18} />
                        </ActionIcon>
                      </Tooltip>
                    ) : null}
                    {canDelete ? (
                      <Tooltip
                        label={
                          isRoleLocked(row, isSuperAdmin)
                            ? roleLockReason(row)
                            : 'Delete'
                        }
                      >
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          aria-label="Delete role"
                          disabled={isRoleLocked(row, isSuperAdmin)}
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

      <RoleForm
        opened={formOpened}
        onClose={closeForm}
        roleId={editingRoleId}
      />
    </Box>
  )
}
