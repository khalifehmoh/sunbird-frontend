import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ModuleForm } from '../ModuleForm/ModuleForm'
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
import { Lock, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import {
  useDeleteModuleMutation,
  useGetModulesQuery,
} from '../../../../redux/features/modules/modulesApi'
import type {
  GetModulesArgs,
  ModuleListItem,
  ModuleStatus,
} from '../../../../redux/features/modules/modulesTypes'
import {
  MODULE_STATUS_COLORS,
  MODULE_STATUS_OPTIONS,
  isModuleLocked,
  moduleLockReason,
} from '../moduleConstants'
import { SortTableHeader } from '../../../../components/SortTableHeader/SortTableHeader'
import { StatusBadge } from '../../../../components/StatusBadge/StatusBadge'
import { DataTable } from '../../../../components/DataTable/DataTable'
import { usePermissions } from '../../../../hooks/usePermissions'

const PAGE_SIZE = 20

const SORT_QUERY_KEY: Record<string, string> = {
  moduleCode: 'moduleCode',
  moduleName: 'moduleName',
  status: 'status',
}

const STATUSES: { value: ModuleStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  ...MODULE_STATUS_OPTIONS,
]

export function ModuleListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const canRead = usePermissions('MODULE:READ')
  const canCreate = usePermissions('MODULE:CREATE')
  const canUpdate = usePermissions('MODULE:UPDATE')
  const canDelete = usePermissions('MODULE:DELETE')

  const [formOpened, setFormOpened] = useState(
    searchParams.get('create') === 'true' || Boolean(searchParams.get('edit')),
  )
  const [editingModuleId, setEditingModuleId] = useState<string | undefined>(
    searchParams.get('edit') ?? undefined,
  )
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebouncedValue(search, 300)
  const [filterStatus, setFilterStatus] = useState<ModuleStatus | ''>('')
  const [sortField, setSortField] = useState('moduleCode')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, filterStatus])

  useEffect(() => {
    const editId = searchParams.get('edit') ?? undefined
    const shouldOpen =
      searchParams.get('create') === 'true' || Boolean(editId)
    if (shouldOpen) {
      setEditingModuleId(editId)
      setFormOpened(true)
    }
  }, [searchParams])

  function openCreateForm() {
    setEditingModuleId(undefined)
    setFormOpened(true)
  }

  function openEditForm(moduleId?: string) {
    if (!moduleId) return
    setEditingModuleId(moduleId)
    setFormOpened(true)
  }

  function closeForm() {
    setFormOpened(false)
    setEditingModuleId(undefined)
    if (searchParams.has('create') || searchParams.has('edit')) {
      setSearchParams({}, { replace: true })
    }
  }

  const sortParam = `${SORT_QUERY_KEY[sortField] ?? sortField}:${sortDir}`

  const queryArgs: GetModulesArgs = useMemo(
    () => ({
      page: page - 1,
      size: PAGE_SIZE,
      search: debouncedSearch,
      status: filterStatus,
      sort: sortParam,
    }),
    [page, debouncedSearch, filterStatus, sortParam],
  )

  const { data, isLoading, isFetching, isError } = useGetModulesQuery(
    queryArgs,
    { skip: !canRead },
  )

  const [deleteModule] = useDeleteModuleMutation()

  function handleSort(field: string) {
    if (field === sortField) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const confirmDelete = (row: ModuleListItem) => {
    modals.openConfirmModal({
      title: 'Delete module',
      children: (
        <Text size="sm">
          Delete <strong>{row.moduleName}</strong> ({row.moduleCode})? This will
          also soft-delete{' '}
          <strong>
            {row.permissionCount} permission
            {row.permissionCount === 1 ? '' : 's'}
          </strong>
          .
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await deleteModule(row.moduleId).unwrap()
          notify({
            type: 'success',
            title: 'Module deleted',
            message: `${row.moduleName} has been deleted.`,
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
        <Text>You don&apos;t have permission to view modules.</Text>
      </Box>
    )
  }

  return (
    <Box p="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Stack gap={4}>
            <Title order={2}>Modules</Title>
            <Text c="dimmed" size="sm">
              System modules that group permissions by functional area.
            </Text>
          </Stack>
          {canCreate ? (
            <Button leftSection={<Plus size={18} />} onClick={openCreateForm}>
              Create module
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
              onChange={(v) => setFilterStatus((v ?? '') as ModuleStatus | '')}
              allowDeselect={false}
              w={160}
            />
          </Group>
        </Paper>

        {isError ? (
          <Text c="red" size="sm">
            Could not load modules. Check the API and try again.
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
          minWidth={800}
          countLabel="module(s)"
          emptyMessage="No modules match the current filters."
        >
          <DataTable.Header>
            <SortTableHeader
              label="Code"
              field="moduleCode"
              activeField={sortField}
              direction={sortDir}
              onSort={handleSort}
            />
            <SortTableHeader
              label="Name"
              field="moduleName"
              activeField={sortField}
              direction={sortDir}
              onSort={handleSort}
            />
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
              <Table.Tr key={row.moduleId}>
                <Table.Td>
                  <Group gap={6} wrap="nowrap">
                    {row.isSystemModule ? (
                      <Tooltip label={moduleLockReason()}>
                        <Lock size={14} />
                      </Tooltip>
                    ) : null}
                    <Badge
                      variant="light"
                      color={row.isSystemModule ? 'blue' : 'neutral'}
                      tt="uppercase"
                    >
                      {row.moduleCode}
                    </Badge>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Stack gap={2}>
                    <Text size="sm" fw={500}>
                      {row.moduleName}
                    </Text>
                    {row.moduleNameAr ? (
                      <Text size="xs" c="dimmed" dir="rtl">
                        {row.moduleNameAr}
                      </Text>
                    ) : null}
                  </Stack>
                </Table.Td>
                <Table.Td>
                  <Button
                    variant="subtle"
                    size="compact-sm"
                    component={Link}
                    to={`/admin/permissions?moduleId=${row.moduleId}`}
                  >
                    {row.permissionCount}
                  </Button>
                </Table.Td>
                <Table.Td>
                  <StatusBadge
                    value={row.status}
                    colorMap={MODULE_STATUS_COLORS}
                    variant="light"
                  />
                </Table.Td>
                <Table.Td ta="right" style={{ verticalAlign: 'middle' }}>
                  <Group gap={4} justify="flex-end" wrap="nowrap">
                    {canUpdate ? (
                      <Tooltip
                        label={
                          isModuleLocked(row) ? moduleLockReason() : 'Edit'
                        }
                      >
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          aria-label="Edit module"
                          disabled={isModuleLocked(row)}
                          onClick={() => openEditForm(row.moduleId)}
                        >
                          <Pencil size={18} />
                        </ActionIcon>
                      </Tooltip>
                    ) : null}
                    {canDelete ? (
                      <Tooltip
                        label={
                          isModuleLocked(row) ? moduleLockReason() : 'Delete'
                        }
                      >
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          aria-label="Delete module"
                          disabled={isModuleLocked(row)}
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

      <ModuleForm
        opened={formOpened}
        onClose={closeForm}
        moduleId={editingModuleId}
      />
    </Box>
  )
}
