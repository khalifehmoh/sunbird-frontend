import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Checkbox,
  Group,
  Loader,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core'
import { modals } from '@mantine/modals'
import { ArrowLeft, Copy } from 'lucide-react'
import { notify } from '../../../../lib/notify'
import { useGetAssignableRolesQuery } from '../../../../redux/features/groups/groupsApi'
import {
  useBatchRolePermissionsMutation,
  useGetRolePermissionsQuery,
  useGetRoleQuery,
  useGrantRolePermissionMutation,
  useLazyGetRolePermissionsQuery,
  useRevokeRolePermissionMutation,
} from '../../../../redux/features/roles/rolesApi'
import { useGetModuleCatalogQuery } from '../../../../redux/features/modules/modulesApi'
import type { ModulePermissionItem } from '../../../../redux/features/modules/modulesTypes'
import { usePermissions } from '../../../../hooks/usePermissions'
import { isPlatformAdmin } from '../../../../hooks/useAuth'
import { useAppSelector } from '../../../../redux/store'
import { MATRIX_OPERATIONS, isRoleLocked } from '../roleConstants'

const MUTATING_OPS = new Set(['CREATE', 'UPDATE', 'DELETE'])

function matrixCheckboxStyles(disabled: boolean, checked = false) {
  const cursor = disabled ? 'not-allowed' : 'pointer'
  return {
    root: { cursor, pointerEvents: 'none' as const },
    input: {
      borderColor: 'var(--mantine-color-gray-6)',
      cursor,
      pointerEvents: 'none' as const,
    },
    icon: {
      ...(disabled && checked
        ? { color: 'var(--mantine-color-gray-7)', opacity: 1 }
        : {}),
    },
  }
}

const ALL_COLUMN_STYLE = {
  borderLeft: '1px solid var(--mantine-color-gray-3)',
  background: 'var(--mantine-color-gray-0)',
  minWidth: 80,
} as const

const MODULE_COLUMN_STYLE = {
  position: 'sticky' as const,
  left: 0,
  background: 'var(--mantine-color-body)',
  borderRight: '1px solid var(--mantine-color-gray-3)',
  minWidth: 200,
}

export function RolePermissionsMatrixPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const roleId = id ?? ''
  const roleCode = useAppSelector((state) => state.auth.role)
  const isSuperAdmin = isPlatformAdmin(roleCode)
  const canRead = usePermissions('ROLE:READ')
  const canGrant = usePermissions('GRANT_PERMISSION')
  const canRevoke = usePermissions('REVOKE_PERMISSION')

  const {
    data: role,
    isLoading: roleLoading,
    isError: roleError,
  } = useGetRoleQuery(roleId, { skip: !roleId || !canRead })
  const { data: modules = [], isLoading: modulesLoading } =
    useGetModuleCatalogQuery(undefined, { skip: !canRead })
  const { data: granted = [] } =
    useGetRolePermissionsQuery(roleId, { skip: !roleId || !canRead })

  const [grantPermission] = useGrantRolePermissionMutation()
  const [revokePermission] = useRevokeRolePermissionMutation()
  const [batchPermissions] = useBatchRolePermissionsMutation()
  const [fetchPermissions] = useLazyGetRolePermissionsQuery()

  const { data: copyRoles = [] } = useGetAssignableRolesQuery(
    role?.tenantId ?? undefined,
    { skip: !role },
  )

  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const [pendingModules, setPendingModules] = useState<Set<string>>(new Set())
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({})
  const [copyRoleId, setCopyRoleId] = useState<string | null>(null)
  const [copying, setCopying] = useState(false)

  const grantedIds = useMemo(() => {
    const ids = new Set(granted.map((item) => item.permissionId))
    for (const [permissionId, isGranted] of Object.entries(optimistic)) {
      if (isGranted) ids.add(permissionId)
      else ids.delete(permissionId)
    }
    return ids
  }, [granted, optimistic])

  const readOnly = Boolean(role && isRoleLocked(role, isSuperAdmin))
  const isLoading = roleLoading || modulesLoading

  function markPending(ids: string[], on: boolean) {
    setPendingIds((current) => {
      const next = new Set(current)
      for (const permissionId of ids) {
        if (on) next.add(permissionId)
        else next.delete(permissionId)
      }
      return next
    })
  }

  function setGrantedState(ids: string[], isGranted: boolean) {
    setOptimistic((current) => {
      const next = { ...current }
      for (const permissionId of ids) next[permissionId] = isGranted
      return next
    })
  }

  async function applyToggle(
    permission: ModulePermissionItem,
    nextGranted: boolean,
  ) {
    markPending([permission.permissionId], true)
    setGrantedState([permission.permissionId], nextGranted)
    try {
      if (nextGranted) {
        await grantPermission({
          roleId,
          permissionId: permission.permissionId,
        }).unwrap()
      } else {
        await revokePermission({
          roleId,
          permissionId: permission.permissionId,
        }).unwrap()
      }
    } catch {
      setGrantedState([permission.permissionId], !nextGranted)
    } finally {
      markPending([permission.permissionId], false)
    }
  }

  function confirmRevokeRead(
    permission: ModulePermissionItem,
    modulePermissions: ModulePermissionItem[],
    onConfirm: () => void,
  ) {
    const stillGranted = modulePermissions.some(
      (item) =>
        MUTATING_OPS.has(item.operation) &&
        grantedIds.has(item.permissionId) &&
        item.permissionId !== permission.permissionId,
    )
    if (!stillGranted) {
      onConfirm()
      return
    }
    modals.openConfirmModal({
      title: 'Revoke READ?',
      children: (
        <Text size="sm">
          CREATE, UPDATE, or DELETE is still granted for this module. Users with
          this role will be able to change records they cannot read.
        </Text>
      ),
      labels: { confirm: 'Revoke READ', cancel: 'Cancel' },
      confirmProps: { color: 'orange' },
      onConfirm,
    })
  }

  function handleCellClick(
    permission: ModulePermissionItem | undefined,
    modulePermissions: ModulePermissionItem[],
  ) {
    if (!permission || readOnly) return
    const nextGranted = !grantedIds.has(permission.permissionId)
    if (nextGranted && !canGrant) return
    if (!nextGranted && !canRevoke) return
    const run = () => void applyToggle(permission, nextGranted)
    if (!nextGranted && permission.operation === 'READ') {
      confirmRevokeRead(permission, modulePermissions, run)
      return
    }
    run()
  }

  async function applyRow(
    moduleId: string,
    permissionIds: string[],
    grant: boolean,
  ) {
    if (permissionIds.length === 0) return
    setPendingModules((current) => new Set(current).add(moduleId))
    markPending(permissionIds, true)
    setGrantedState(permissionIds, grant)
    try {
      await batchPermissions({
        roleId,
        permissionIds,
        revoke: !grant,
      }).unwrap()
    } catch {
      setGrantedState(permissionIds, !grant)
    } finally {
      markPending(permissionIds, false)
      setPendingModules((current) => {
        const next = new Set(current)
        next.delete(moduleId)
        return next
      })
    }
  }

  function handleRowMaster(
    moduleId: string,
    modulePermissions: ModulePermissionItem[],
    grantAll: boolean,
  ) {
    const permissionIds = modulePermissions.map((item) => item.permissionId)
    if (grantAll && !canGrant) return
    if (!grantAll && !canRevoke) return
    const run = () => void applyRow(moduleId, permissionIds, grantAll)
    if (!grantAll) {
      const readPerm = modulePermissions.find((item) => item.operation === 'READ')
      if (readPerm && grantedIds.has(readPerm.permissionId)) {
        confirmRevokeRead(readPerm, modulePermissions, run)
        return
      }
    }
    run()
  }

  function handleCopy() {
    if (!copyRoleId || readOnly || !canGrant) return
    const source = copyRoles.find((item) => item.roleId === copyRoleId)
    modals.openConfirmModal({
      title: 'Copy permissions',
      children: (
        <Text size="sm">
          Replace all permissions on <strong>{role?.roleName}</strong> with
          those from <strong>{source?.roleName}</strong>? This saves
          immediately.
        </Text>
      ),
      labels: { confirm: 'Copy', cancel: 'Cancel' },
      onConfirm: async () => {
        setCopying(true)
        try {
          const sourcePerms = await fetchPermissions(copyRoleId).unwrap()
          const sourceIds = sourcePerms.map((item) => item.permissionId)
          const currentIds = granted.map((item) => item.permissionId)
          const toGrant = sourceIds.filter((item) => !currentIds.includes(item))
          const toRevoke = currentIds.filter((item) => !sourceIds.includes(item))
          if (toGrant.length > 0) {
            await batchPermissions({
              roleId,
              permissionIds: toGrant,
            }).unwrap()
          }
          if (toRevoke.length > 0) {
            await batchPermissions({
              roleId,
              permissionIds: toRevoke,
              revoke: true,
            }).unwrap()
          }
          setOptimistic({})
          notify({
            type: 'success',
            title: 'Permissions copied',
            message: `Copied permissions from ${source?.roleName ?? 'the selected role'}.`,
          })
        } catch {
          // Shared base query shows API errors.
        } finally {
          setCopying(false)
        }
      },
    })
  }

  if (!canRead) {
    return (
      <Box p="xl">
        <Text>You don&apos;t have permission to view role permissions.</Text>
      </Box>
    )
  }

  if (roleError) {
    return (
      <Box p="xl">
        <Alert color="red" title="Role not found">
          The role could not be loaded.
        </Alert>
      </Box>
    )
  }

  return (
    <Box p="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Group align="flex-start" gap="sm">
            <ActionIcon
              variant="subtle"
              color="gray"
              aria-label="Back to roles"
              onClick={() => navigate('/admin/roles')}
            >
              <ArrowLeft size={18} />
            </ActionIcon>
            <Stack gap={4}>
              <Group gap="sm">
                <Title order={2}>
                  {roleLoading ? 'Role permissions' : role?.roleName}
                </Title>
                {role ? (
                  <Badge
                    variant="light"
                    color={role.isSystemRole ? 'blue' : 'neutral'}
                  >
                    {role.isSystemRole ? 'SYSTEM' : 'CUSTOM'}
                  </Badge>
                ) : null}
              </Group>
              <Text c="dimmed" size="sm">
                Grant and revoke permissions immediately. There is no submit
                button.
              </Text>
            </Stack>
          </Group>
        </Group>

        {readOnly ? (
          <Alert color="blue" title={role?.isSystemRole ? 'System role' : 'Global role'}>
            {role?.isSystemRole
              ? 'System role permissions are read-only.'
              : 'Global role permissions are managed by platform administrators.'}
          </Alert>
        ) : (
          <Paper withBorder p="md" radius="md">
            <Group align="flex-end" wrap="wrap" gap="md">
              <Select
                label="Copy from role"
                placeholder="Select a role"
                searchable
                clearable
                w={280}
                data={copyRoles
                  .filter((item) => item.roleId !== roleId)
                  .map((item) => ({
                    value: item.roleId,
                    label: `${item.roleName} (${item.roleCode})`,
                  }))}
                value={copyRoleId}
                onChange={setCopyRoleId}
                disabled={!canGrant}
              />
              <Button
                leftSection={<Copy size={16} />}
                onClick={handleCopy}
                disabled={!copyRoleId || !canGrant}
                loading={copying}
              >
                Copy
              </Button>
            </Group>
          </Paper>
        )}

        {isLoading ? (
          <Stack>
            <Skeleton height={48} />
            <Skeleton height={240} />
          </Stack>
        ) : (
          <Paper withBorder radius="md" style={{ overflow: 'auto' }}>
            <Table stickyHeader style={{ minWidth: 860 }}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ ...MODULE_COLUMN_STYLE, zIndex: 3 }}>
                    Module
                  </Table.Th>
                  {MATRIX_OPERATIONS.map((operation) => (
                    <Table.Th key={operation} ta="center">
                      {operation}
                    </Table.Th>
                  ))}
                  <Table.Th ta="center" style={ALL_COLUMN_STYLE}>
                    All
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {modules.map((module) => {
                  const byOperation = new Map(
                    module.permissions.map((item) => [item.operation, item]),
                  )
                  const rowPermissions = MATRIX_OPERATIONS.map((operation) =>
                    byOperation.get(operation),
                  ).filter((item): item is ModulePermissionItem => Boolean(item))
                  const grantedCount = rowPermissions.filter((item) =>
                    grantedIds.has(item.permissionId),
                  ).length
                  const allGranted =
                    rowPermissions.length > 0 &&
                    grantedCount === rowPermissions.length
                  const someGranted = grantedCount > 0 && !allGranted
                  const rowBusy = pendingModules.has(module.moduleId)
                  const allDisabled =
                    readOnly ||
                    rowPermissions.length === 0 ||
                    (allGranted ? !canRevoke : !canGrant)

                  return (
                    <Table.Tr key={module.moduleId}>
                      <Table.Td
                        style={{
                          ...MODULE_COLUMN_STYLE,
                          zIndex: 1,
                          fontWeight: 600,
                        }}
                      >
                        <Stack gap={2}>
                          <Text size="sm" fw={700}>
                            {module.moduleName}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {module.moduleCode}
                          </Text>
                        </Stack>
                      </Table.Td>
                      {MATRIX_OPERATIONS.map((operation) => {
                        const permission = byOperation.get(operation)
                        if (!permission) {
                          return (
                            <Table.Td key={operation} ta="center">
                              <Group justify="center">
                                <Text size="sm" c="dimmed">
                                  —
                                </Text>
                              </Group>
                            </Table.Td>
                          )
                        }
                        const checked = grantedIds.has(permission.permissionId)
                        const cellPending = pendingIds.has(permission.permissionId)
                        const canToggle = checked ? canRevoke : canGrant
                        const disabled = readOnly || !canToggle
                        return (
                          <Table.Td
                            key={operation}
                            ta="center"
                            tabIndex={disabled || cellPending ? -1 : 0}
                            role="checkbox"
                            aria-checked={checked}
                            aria-label={`${module.moduleName} ${operation}`}
                            aria-disabled={disabled}
                            onClick={() => {
                              if (disabled || cellPending) return
                              handleCellClick(permission, rowPermissions)
                            }}
                            onKeyDown={(event) => {
                              if (disabled || cellPending) return
                              if (event.key !== ' ' && event.key !== 'Enter') {
                                return
                              }
                              event.preventDefault()
                              handleCellClick(permission, rowPermissions)
                            }}
                            style={{
                              cursor: disabled ? 'not-allowed' : 'pointer',
                              userSelect: 'none',
                            }}
                          >
                            <Group justify="center">
                              {cellPending ? (
                                <Loader size="xs" color="gray" />
                              ) : (
                                <Checkbox
                                  checked={checked}
                                  disabled={disabled}
                                  tabIndex={-1}
                                  aria-hidden
                                  color="teal"
                                  styles={matrixCheckboxStyles(disabled, checked)}
                                />
                              )}
                            </Group>
                          </Table.Td>
                        )
                      })}
                      <Table.Td
                        ta="center"
                        style={{
                          ...ALL_COLUMN_STYLE,
                          cursor: allDisabled ? 'not-allowed' : 'pointer',
                          userSelect: 'none',
                        }}
                        tabIndex={allDisabled || rowBusy ? -1 : 0}
                        role="checkbox"
                        aria-checked={someGranted ? 'mixed' : allGranted}
                        aria-label={`Select all ${module.moduleName}`}
                        aria-disabled={allDisabled}
                        onClick={() => {
                          if (allDisabled || rowBusy) return
                          handleRowMaster(
                            module.moduleId,
                            rowPermissions,
                            !allGranted,
                          )
                        }}
                        onKeyDown={(event) => {
                          if (allDisabled || rowBusy) return
                          if (event.key !== ' ' && event.key !== 'Enter') {
                            return
                          }
                          event.preventDefault()
                          handleRowMaster(
                            module.moduleId,
                            rowPermissions,
                            !allGranted,
                          )
                        }}
                      >
                        <Group justify="center">
                          {rowBusy ? (
                            <Loader size="xs" color="gray" />
                          ) : (
                            <Checkbox
                              checked={allGranted}
                              indeterminate={someGranted}
                              disabled={allDisabled}
                              tabIndex={-1}
                              aria-hidden
                              color="teal"
                              styles={matrixCheckboxStyles(
                                allDisabled,
                                allGranted || someGranted,
                              )}
                            />
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  )
                })}
              </Table.Tbody>
            </Table>
            {modules.length === 0 ? (
              <Text p="md" size="sm" c="dimmed">
                No modules are defined yet.
              </Text>
            ) : null}
          </Paper>
        )}
      </Stack>
    </Box>
  )
}
