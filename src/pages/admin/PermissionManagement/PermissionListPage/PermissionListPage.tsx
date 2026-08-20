import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PermissionForm } from '../PermissionForm/PermissionForm'
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
  Title,
  Tooltip,
} from '@mantine/core'
import { modals } from '@mantine/modals'
import { notify } from '../../../../lib/notify'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import {
  useDeletePermissionMutation,
  useGetModuleCatalogQuery,
  useGetPermissionsQuery,
} from '../../../../redux/features/modules/modulesApi'
import type {
  GetPermissionsArgs,
  PermissionListItem,
  PermissionOperation,
} from '../../../../redux/features/modules/modulesTypes'
import { OperationBadge, OperationSelect } from '../OperationSelect'
import { SortTableHeader } from '../../../../components/SortTableHeader/SortTableHeader'
import { DataTable } from '../../../../components/DataTable/DataTable'
import { usePermissions } from '../../../../hooks/usePermissions'

const PAGE_SIZE = 20

const SORT_QUERY_KEY: Record<string, string> = {
  permissionCode: 'permissionCode',
  permissionName: 'permissionName',
  operation: 'operation',
  moduleName: 'moduleName',
}

export function PermissionListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const canRead = usePermissions('PERMISSION:READ')
  const canCreate = usePermissions('PERMISSION:CREATE')
  const canUpdate = usePermissions('PERMISSION:UPDATE')
  const canDelete = usePermissions('PERMISSION:DELETE')

  const [formOpened, setFormOpened] = useState(
    searchParams.get('create') === 'true' || Boolean(searchParams.get('edit')),
  )
  const [editingPermissionId, setEditingPermissionId] = useState<
    string | undefined
  >(searchParams.get('edit') ?? undefined)
  const [page, setPage] = useState(1)
  const [filterModuleId, setFilterModuleId] = useState(
    searchParams.get('moduleId') ?? '',
  )
  const [filterOperation, setFilterOperation] = useState<
    PermissionOperation | ''
  >('')
  const [sortField, setSortField] = useState('moduleName')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const { data: catalog = [] } = useGetModuleCatalogQuery(undefined, {
    skip: !canRead,
  })

  useEffect(() => {
    setPage(1)
  }, [filterModuleId, filterOperation])

  useEffect(() => {
    const moduleId = searchParams.get('moduleId') ?? ''
    if (moduleId !== filterModuleId) {
      setFilterModuleId(moduleId)
    }
    const editId = searchParams.get('edit') ?? undefined
    const shouldOpen =
      searchParams.get('create') === 'true' || Boolean(editId)
    if (shouldOpen) {
      setEditingPermissionId(editId)
      setFormOpened(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  function openCreateForm() {
    setEditingPermissionId(undefined)
    setFormOpened(true)
  }

  function openEditForm(permissionId?: string) {
    if (!permissionId) return
    setEditingPermissionId(permissionId)
    setFormOpened(true)
  }

  function closeForm() {
    setFormOpened(false)
    setEditingPermissionId(undefined)
    if (searchParams.has('create') || searchParams.has('edit')) {
      const next = new URLSearchParams(searchParams)
      next.delete('create')
      next.delete('edit')
      setSearchParams(next, { replace: true })
    }
  }

  function setModuleFilter(moduleId: string) {
    setFilterModuleId(moduleId)
    const next = new URLSearchParams(searchParams)
    if (moduleId) next.set('moduleId', moduleId)
    else next.delete('moduleId')
    setSearchParams(next, { replace: true })
  }

  const sortParam = `${SORT_QUERY_KEY[sortField] ?? sortField}:${sortDir}`

  const queryArgs: GetPermissionsArgs = useMemo(
    () => ({
      page: page - 1,
      size: PAGE_SIZE,
      moduleId: filterModuleId,
      operation: filterOperation,
      sort: sortParam,
    }),
    [page, filterModuleId, filterOperation, sortParam],
  )

  const { data, isLoading, isFetching, isError } = useGetPermissionsQuery(
    queryArgs,
    { skip: !canRead },
  )

  const [deletePermission] = useDeletePermissionMutation()

  function handleSort(field: string) {
    if (field === sortField) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const confirmDelete = (row: PermissionListItem) => {
    modals.openConfirmModal({
      title: 'Delete permission',
      children: (
        <Text size="sm">
          Delete <strong>{row.permissionCode}</strong>?
          {row.roleCount > 0
            ? ` This permission is assigned to ${row.roleCount} role${
                row.roleCount === 1 ? '' : 's'
              } and cannot be deleted until those assignments are revoked.`
            : ' Roles that still use it will block deletion.'}
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red', disabled: row.roleCount > 0 },
      onConfirm: async () => {
        if (row.roleCount > 0) return
        try {
          await deletePermission(row.permissionId).unwrap()
          notify({
            type: 'success',
            title: 'Permission deleted',
            message: `${row.permissionCode} has been deleted.`,
          })
        } catch {
          // Shared base query shows API errors.
        }
      },
    })
  }

  const rows = data?.content ?? []
  const totalPages = Math.max(1, data?.totalPages ?? 1)

  const groupedRows = useMemo(() => {
    const groups: { moduleId: string; moduleName: string; items: PermissionListItem[] }[] =
      []
    for (const row of rows) {
      const last = groups[groups.length - 1]
      if (last && last.moduleId === row.moduleId) {
        last.items.push(row)
      } else {
        groups.push({
          moduleId: row.moduleId,
          moduleName: row.moduleName,
          items: [row],
        })
      }
    }
    return groups
  }, [rows])

  const moduleOptions = [
    { value: '', label: 'All modules' },
    ...catalog.map((module) => ({
      value: module.moduleId,
      label: `${module.moduleName} (${module.moduleCode})`,
    })),
  ]

  if (!canRead) {
    return (
      <Box p="xl">
        <Text>You don&apos;t have permission to view permissions.</Text>
      </Box>
    )
  }

  return (
    <Box p="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Stack gap={4}>
            <Title order={2}>Permissions</Title>
            <Text c="dimmed" size="sm">
              Module and operation combinations that define granular access.
            </Text>
          </Stack>
          {canCreate ? (
            <Button leftSection={<Plus size={18} />} onClick={openCreateForm}>
              Create permission
            </Button>
          ) : null}
        </Group>

        <Paper withBorder p="md" radius="md">
          <Group align="flex-end" wrap="wrap" gap="md">
            <Select
              label="Module"
              data={moduleOptions}
              value={filterModuleId}
              onChange={(v) => setModuleFilter(v ?? '')}
              searchable
              allowDeselect={false}
              style={{ flex: 1, minWidth: 220 }}
            />
            <OperationSelect
              value={filterOperation}
              onChange={setFilterOperation}
              includeAll
              w={200}
            />
          </Group>
        </Paper>

        {isError ? (
          <Text c="red" size="sm">
            Could not load permissions. Check the API and try again.
          </Text>
        ) : null}

        <DataTable
          isLoading={isLoading}
          isFetching={isFetching}
          totalElements={data?.totalElements ?? rows.length}
          totalPages={totalPages}
          page={page}
          onPageChange={setPage}
          colSpan={5}
          minWidth={900}
          countLabel="permission(s)"
          emptyMessage="No permissions match the current filters."
        >
          <DataTable.Header>
            <SortTableHeader
              label="Code"
              field="permissionCode"
              activeField={sortField}
              direction={sortDir}
              onSort={handleSort}
            />
            <SortTableHeader
              label="Module"
              field="moduleName"
              activeField={sortField}
              direction={sortDir}
              onSort={handleSort}
            />
            <SortTableHeader
              label="Operation"
              field="operation"
              activeField={sortField}
              direction={sortDir}
              onSort={handleSort}
            />
            <SortTableHeader
              label="Display name"
              field="permissionName"
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
            {groupedRows.flatMap((group) => [
              <Table.Tr key={`group-${group.moduleId}`}>
                <Table.Td
                  colSpan={5}
                  style={{ background: 'var(--mantine-color-gray-0)' }}
                >
                  <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                    {group.moduleName}
                  </Text>
                </Table.Td>
              </Table.Tr>,
              ...group.items.map((row) => (
                <Table.Tr key={row.permissionId}>
                  <Table.Td>
                    <Badge variant="light" color="neutral" tt="uppercase">
                      {row.permissionCode}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Stack gap={2}>
                      <Text size="sm">{row.moduleName}</Text>
                      <Text size="xs" c="dimmed">
                        {row.moduleCode}
                      </Text>
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <OperationBadge operation={row.operation} />
                  </Table.Td>
                  <Table.Td>
                    <Stack gap={2}>
                      <Text size="sm" fw={500}>
                        {row.permissionName}
                      </Text>
                      {row.permissionNameAr ? (
                        <Text size="xs" c="dimmed" dir="rtl">
                          {row.permissionNameAr}
                        </Text>
                      ) : null}
                    </Stack>
                  </Table.Td>
                  <Table.Td ta="right" style={{ verticalAlign: 'middle' }}>
                    <Group gap={4} justify="flex-end" wrap="nowrap">
                      {canUpdate ? (
                        <Tooltip label="Edit">
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            aria-label="Edit permission"
                            onClick={() => openEditForm(row.permissionId)}
                          >
                            <Pencil size={18} />
                          </ActionIcon>
                        </Tooltip>
                      ) : null}
                      {canDelete ? (
                        <Tooltip
                          label={
                            row.roleCount > 0
                              ? 'Assigned to one or more roles'
                              : 'Delete'
                          }
                        >
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            aria-label="Delete permission"
                            disabled={row.roleCount > 0}
                            onClick={() => confirmDelete(row)}
                          >
                            <Trash2 size={18} />
                          </ActionIcon>
                        </Tooltip>
                      ) : null}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              )),
            ])}
          </DataTable.Body>
        </DataTable>
      </Stack>

      <PermissionForm
        opened={formOpened}
        onClose={closeForm}
        permissionId={editingPermissionId}
        defaultModuleId={filterModuleId || undefined}
      />
    </Box>
  )
}
