import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { UserForm } from '../UserForm/UserForm'
import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Checkbox,
  Code,
  Group,
  Menu,
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
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import {
  Eye,
  KeyRound,
  Lock,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Shield,
  Trash2,
  Unlock,
} from 'lucide-react'
import {
  useBulkPatchUserStatusMutation,
  useDeleteUserMutation,
  useGetUsersQuery,
  usePatchUserStatusMutation,
  useResetUserPasswordMutation,
} from '../../../../redux/features/users/usersApi'
import type {
  GetUsersArgs,
  UserListItem,
  UserStatus,
} from '../../../../redux/features/users/usersTypes'
import { useGetTenantsQuery } from '../../../../redux/features/tenants/tenantsApi'
import {
  USER_STATUS_COLORS,
  USER_STATUS_OPTIONS,
  userDisplayName,
  userInitials,
} from '../userConstants'
import { SortTableHeader } from '../../../../components/SortTableHeader/SortTableHeader'
import { StatusBadge } from '../../../../components/StatusBadge/StatusBadge'
import { DataTable } from '../../../../components/DataTable/DataTable'
import { usePermissions } from '../../../../hooks/usePermissions'
import { useAppSelector } from '../../../../redux/store'

dayjs.extend(relativeTime)

const PAGE_SIZE = 20

const SORT_QUERY_KEY: Record<string, string> = {
  username: 'username',
  fullName: 'firstName',
  email: 'email',
  status: 'status',
  lastLoginAt: 'lastLoginAt',
  tenantName: 'tenantName',
}

const STATUSES: { value: UserStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  ...USER_STATUS_OPTIONS,
]

export function UserListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const role = useAppSelector((state) => state.auth.role)
  const isSuperAdmin = role === 'ADMIN'
  const canRead = usePermissions('USER:READ')
  const canCreate = usePermissions('USER:CREATE')
  const canUpdate = usePermissions('USER:UPDATE')
  const canDelete = usePermissions('USER:DELETE')

  const [formOpened, setFormOpened] = useState(
    searchParams.get('create') === 'true' || Boolean(searchParams.get('edit')),
  )
  const [editingUserId, setEditingUserId] = useState<string | undefined>(
    searchParams.get('edit') ?? undefined,
  )
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebouncedValue(search, 300)
  const [filterStatus, setFilterStatus] = useState<UserStatus | ''>('')
  const [filterTenant, setFilterTenant] = useState('')
  const [sortField, setSortField] = useState('username')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    setPage(1)
    setSelectedIds([])
  }, [debouncedSearch, filterStatus, filterTenant])

  useEffect(() => {
    const editId = searchParams.get('edit') ?? undefined
    const shouldOpen =
      searchParams.get('create') === 'true' || Boolean(editId)
    if (shouldOpen) {
      setEditingUserId(editId)
      setFormOpened(true)
    }
  }, [searchParams])

  function openCreateForm() {
    setEditingUserId(undefined)
    setFormOpened(true)
  }

  function openEditForm(userId?: string) {
    if (!userId) return
    setEditingUserId(userId)
    setFormOpened(true)
  }

  function closeForm() {
    setFormOpened(false)
    setEditingUserId(undefined)
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

  const queryArgs: GetUsersArgs = useMemo(
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

  const { data, isLoading, isFetching, isError } = useGetUsersQuery(queryArgs, {
    skip: !canRead,
  })

  const [deleteUser] = useDeleteUserMutation()
  const [patchStatus] = usePatchUserStatusMutation()
  const [bulkPatchStatus] = useBulkPatchUserStatusMutation()
  const [resetPassword] = useResetUserPasswordMutation()

  function handleSort(field: string) {
    if (field === sortField) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const confirmSetStatus = (row: UserListItem, status: UserStatus) => {
    if (status === row.status) return
    modals.openConfirmModal({
      title: 'Update user status',
      children: (
        <Text size="sm">
          Set <strong>{userDisplayName(row)}</strong> ({row.username}) to{' '}
          <strong>{status}</strong>?
        </Text>
      ),
      labels: { confirm: 'Save', cancel: 'Cancel' },
      onConfirm: async () => {
        try {
          await patchStatus({ userId: row.userId, status }).unwrap()
          notify({
            type: 'success',
            title: 'Status updated',
            message: `${userDisplayName(row)} is now ${status}.`,
          })
        } catch {
          // Shared base query shows API errors.
        }
      },
    })
  }

  const confirmResetPassword = (row: UserListItem) => {
    modals.openConfirmModal({
      title: 'Reset password',
      children: (
        <Text size="sm">
          Reset password for <strong>{userDisplayName(row)}</strong>? Active
          sessions will be terminated.
        </Text>
      ),
      labels: { confirm: 'Reset', cancel: 'Cancel' },
      confirmProps: { color: 'orange' },
      onConfirm: async () => {
        try {
          const result = await resetPassword(row.userId).unwrap()
          notify({
            type: 'success',
            title: 'Password reset',
            message: result.temporaryPassword
              ? `Temporary password: ${result.temporaryPassword}`
              : 'Password was reset successfully.',
            autoClose: 12000,
          })
        } catch {
          // Shared base query shows API errors.
        }
      },
    })
  }

  const confirmDelete = (row: UserListItem) => {
    modals.openConfirmModal({
      title: 'Delete user',
      children: (
        <Text size="sm">
          Delete <strong>{userDisplayName(row)}</strong> ({row.username})?
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await deleteUser(row.userId).unwrap()
          notify({
            type: 'success',
            title: 'User deleted',
            message: `${userDisplayName(row)} has been deleted.`,
          })
        } catch {
          // Shared base query shows API errors.
        }
      },
    })
  }

  const confirmBulkStatus = (status: UserStatus) => {
    if (selectedIds.length === 0) return
    modals.openConfirmModal({
      title: 'Bulk update status',
      children: (
        <Text size="sm">
          Set <strong>{selectedIds.length}</strong> selected users to{' '}
          <strong>{status}</strong>?
        </Text>
      ),
      labels: { confirm: 'Update', cancel: 'Cancel' },
      onConfirm: async () => {
        try {
          const result = await bulkPatchStatus({
            userIds: selectedIds,
            status,
          }).unwrap()
          setSelectedIds([])
          notify({
            type: 'success',
            title: 'Bulk status updated',
            message: `${result.updated} users set to ${status}.`,
          })
        } catch {
          // Shared base query shows API errors.
        }
      },
    })
  }

  const rows = data?.content ?? []
  const totalPages = Math.max(1, data?.totalPages ?? 1)
  const allSelected =
    rows.length > 0 && rows.every((row) => selectedIds.includes(row.userId))

  if (!canRead) {
    return (
      <Box p="xl">
        <Text>You don&apos;t have permission to view users.</Text>
      </Box>
    )
  }

  return (
    <Box p="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Stack gap={4}>
            <Title order={2}>Users</Title>
            <Text c="dimmed" size="sm">
              Platform accounts — search, filter, lock, and manage access.
            </Text>
          </Stack>
          {canCreate ? (
            <Button leftSection={<Plus size={18} />} onClick={openCreateForm}>
              Create user
            </Button>
          ) : null}
        </Group>

        <Paper withBorder p="md" radius="md">
          <Group align="flex-end" wrap="wrap" gap="md">
            <TextInput
              label="Search"
              placeholder="Name, username, or email"
              leftSection={<Search size={16} />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              style={{ flex: 1, minWidth: 220 }}
            />
            <Select
              label="Status"
              data={STATUSES}
              value={filterStatus}
              onChange={(v) => setFilterStatus((v ?? '') as UserStatus | '')}
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

        {selectedIds.length > 0 && canUpdate ? (
          <Paper withBorder p="sm" radius="md">
            <Group justify="space-between">
              <Text size="sm">
                <strong>{selectedIds.length}</strong> selected
              </Text>
              <Group gap="xs">
                <Button
                  size="xs"
                  variant="light"
                  color="teal"
                  onClick={() => confirmBulkStatus('ACTIVE')}
                >
                  Activate
                </Button>
                <Button
                  size="xs"
                  variant="light"
                  color="gray"
                  onClick={() => confirmBulkStatus('INACTIVE')}
                >
                  Deactivate
                </Button>
                <Button
                  size="xs"
                  variant="subtle"
                  onClick={() => setSelectedIds([])}
                >
                  Clear
                </Button>
              </Group>
            </Group>
          </Paper>
        ) : null}

        {isError ? (
          <Text c="red" size="sm">
            Could not load users. Check the API and try again.
          </Text>
        ) : null}

        <DataTable
          isLoading={isLoading}
          isFetching={isFetching}
          totalElements={data?.totalElements ?? rows.length}
          totalPages={totalPages}
          page={page}
          onPageChange={setPage}
          colSpan={isSuperAdmin ? 10 : 9}
          minWidth={1100}
          countLabel="user(s)"
          emptyMessage="No users match the current filters."
        >
          <DataTable.Header>
            <Table.Th w={40}>
              <Checkbox
                aria-label="Select all users on page"
                checked={allSelected}
                indeterminate={
                  selectedIds.length > 0 &&
                  !allSelected &&
                  rows.some((row) => selectedIds.includes(row.userId))
                }
                onChange={() => {
                  if (allSelected) {
                    setSelectedIds((prev) =>
                      prev.filter(
                        (id) => !rows.some((row) => row.userId === id),
                      ),
                    )
                  } else {
                    setSelectedIds((prev) => [
                      ...new Set([
                        ...prev,
                        ...rows.map((row) => row.userId),
                      ]),
                    ])
                  }
                }}
              />
            </Table.Th>
            <Table.Th w={56} />
            <SortTableHeader
              label="Name"
              field="fullName"
              activeField={sortField}
              direction={sortDir}
              onSort={handleSort}
            />
            <SortTableHeader
              label="Username"
              field="username"
              activeField={sortField}
              direction={sortDir}
              onSort={handleSort}
            />
            <SortTableHeader
              label="Email"
              field="email"
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
              label="Status"
              field="status"
              activeField={sortField}
              direction={sortDir}
              onSort={handleSort}
            />
            <Table.Th>
              <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                MFA
              </Text>
            </Table.Th>
            <SortTableHeader
              label="Last login"
              field="lastLoginAt"
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
                key={row.userId}
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/admin/users/${row.userId}`)}
              >
                <Table.Td onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    aria-label={`Select ${row.username}`}
                    checked={selectedIds.includes(row.userId)}
                    onChange={() =>
                      setSelectedIds((prev) =>
                        prev.includes(row.userId)
                          ? prev.filter((id) => id !== row.userId)
                          : [...prev, row.userId],
                      )
                    }
                  />
                </Table.Td>
                <Table.Td>
                  <Avatar radius="xl" size={40} color="blue">
                    {userInitials(row)}
                  </Avatar>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" fw={500}>
                    {userDisplayName(row)}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Badge variant="light" color="neutral" tt="none">
                    <Code>{row.username}</Code>
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{row.email}</Text>
                </Table.Td>
                {isSuperAdmin ? (
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {row.tenantName ?? '—'}
                    </Text>
                  </Table.Td>
                ) : null}
                <Table.Td>
                  <StatusBadge
                    value={row.status}
                    colorMap={USER_STATUS_COLORS}
                    variant="light"
                  />
                </Table.Td>
                <Table.Td>
                  {row.mfaEnabled ? (
                    <Tooltip label="MFA enabled">
                      <Shield size={16} color="var(--mantine-color-teal-6)" />
                    </Tooltip>
                  ) : (
                    <Text size="xs" c="dimmed">
                      —
                    </Text>
                  )}
                </Table.Td>
                <Table.Td>
                  <Text size="sm">
                    {row.lastLoginAt
                      ? dayjs(row.lastLoginAt).fromNow()
                      : 'Never'}
                  </Text>
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
                        aria-label="View user"
                        component={Link}
                        to={`/admin/users/${row.userId}`}
                      >
                        <Eye size={18} />
                      </ActionIcon>
                    </Tooltip>
                    {canUpdate ? (
                      <>
                        <Tooltip label="Edit">
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            aria-label="Edit user"
                            onClick={() => openEditForm(row.userId)}
                          >
                            <Pencil size={18} />
                          </ActionIcon>
                        </Tooltip>
                        {row.status === 'LOCKED' ? (
                          <Tooltip label="Unlock">
                            <ActionIcon
                              variant="subtle"
                              color="teal"
                              aria-label="Unlock user"
                              onClick={() =>
                                confirmSetStatus(row, 'ACTIVE')
                              }
                            >
                              <Unlock size={18} />
                            </ActionIcon>
                          </Tooltip>
                        ) : (
                          <Tooltip label="Lock">
                            <ActionIcon
                              variant="subtle"
                              color="orange"
                              aria-label="Lock user"
                              onClick={() =>
                                confirmSetStatus(row, 'LOCKED')
                              }
                            >
                              <Lock size={18} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                      </>
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
                                    onClick={() =>
                                      confirmSetStatus(
                                        row,
                                        s.value as UserStatus,
                                      )
                                    }
                                  >
                                    Set {s.label}
                                  </Menu.Item>
                                ),
                              )}
                              <Menu.Divider />
                              <Menu.Item
                                leftSection={<KeyRound size={14} />}
                                onClick={() => confirmResetPassword(row)}
                              >
                                Reset password
                              </Menu.Item>
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

      <UserForm
        opened={formOpened}
        onClose={closeForm}
        userId={editingUserId}
        defaultTenantId={
          (searchParams.get('tenantId') ?? filterTenant) || undefined
        }
      />
    </Box>
  )
}
