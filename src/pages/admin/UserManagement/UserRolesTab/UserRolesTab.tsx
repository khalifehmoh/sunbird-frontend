import { useMemo, useState } from 'react'
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Modal,
  Select,
  Stack,
  Table,
  Text,
  Title,
  Tooltip,
} from '@mantine/core'
import { modals } from '@mantine/modals'
import { notify } from '../../../../lib/notify'
import { Plus, Trash2 } from 'lucide-react'
import { useGetAssignableRolesQuery } from '../../../../redux/features/groups/groupsApi'
import {
  useAssignUserRoleMutation,
  useGetUserEffectivePermissionsQuery,
  useGetUserRolesQuery,
  useRevokeUserRoleMutation,
} from '../../../../redux/features/users/usersApi'
import type { UserRoleItem } from '../../../../redux/features/users/usersTypes'
import { usePermissions } from '../../../../hooks/usePermissions'

export function UserRolesTab({
  userId,
  tenantId,
  enabled,
}: {
  userId: string
  tenantId: string | null
  enabled: boolean
}) {
  const [assignOpened, setAssignOpened] = useState(false)
  const canAssign = usePermissions('ASSIGN_ROLE')
  const canRevoke = usePermissions('REVOKE_ROLE')

  const skip = !userId || !enabled
  const { data: roles = [], isFetching: rolesLoading } = useGetUserRolesQuery(
    userId,
    { skip: skip && !assignOpened },
  )
  const { data: permissions = [], isFetching: permissionsLoading } =
    useGetUserEffectivePermissionsQuery(userId, { skip })
  const [revokeRole] = useRevokeUserRoleMutation()

  function confirmRevoke(role: UserRoleItem) {
    modals.openConfirmModal({
      title: 'Revoke role',
      children: (
        <Text size="sm">
          Revoke <strong>{role.roleName}</strong> from this user?
        </Text>
      ),
      labels: { confirm: 'Revoke', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await revokeRole({ userId, roleId: role.roleId }).unwrap()
          notify({
            type: 'success',
            title: 'Role revoked',
            message: `${role.roleName} is no longer assigned to this user.`,
          })
        } catch {
          // Shared base query shows API errors.
        }
      },
    })
  }

  return (
    <Stack gap="lg">
      <Stack gap="md">
        <Group justify="space-between" wrap="nowrap" align="center" gap="xl">
          <Text size="sm" c="dimmed" style={{ flex: 1, minWidth: 0 }}>
            Direct assignments plus roles inherited from active groups.
            Inactive roles stay listed so they can be revoked, but they do not
            grant access.
          </Text>
          {canAssign ? (
            <Button
              size="sm"
              leftSection={<Plus size={16} />}
              onClick={() => setAssignOpened(true)}
              style={{ flexShrink: 0 }}
            >
              Assign role
            </Button>
          ) : null}
        </Group>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Code</Table.Th>
              <Table.Th>Name</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Source</Table.Th>
              <Table.Th ta="right">Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rolesLoading && roles.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text size="sm" c="dimmed">
                    Loading roles…
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : roles.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text size="sm" c="dimmed">
                    No roles assigned yet.
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              roles.map((role) => (
                <Table.Tr
                  key={`${role.source}-${role.roleId}-${role.groupId ?? role.userRoleId ?? ''}`}
                >
                  <Table.Td>
                    <Badge variant="light" color="neutral" tt="uppercase">
                      {role.roleCode}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Stack gap={2}>
                      <Text size="sm" fw={500}>
                        {role.roleName}
                      </Text>
                      {role.roleNameAr ? (
                        <Text size="xs" c="dimmed" dir="rtl">
                          {role.roleNameAr}
                        </Text>
                      ) : null}
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      variant="outline"
                      color={role.isSystemRole ? 'blue' : 'neutral'}
                    >
                      {role.isSystemRole ? 'System' : 'Tenant'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Stack gap={2}>
                      <Badge
                        variant="light"
                        color={role.source === 'DIRECT' ? 'blue' : 'violet'}
                      >
                        {role.source === 'DIRECT' ? 'Direct' : 'Group'}
                      </Badge>
                      {role.source === 'GROUP' && role.groupName ? (
                        <Text size="xs" c="dimmed">
                          {role.groupName}
                        </Text>
                      ) : null}
                    </Stack>
                  </Table.Td>
                  <Table.Td ta="right">
                    {canRevoke && role.source === 'DIRECT' ? (
                      <Tooltip label="Revoke role">
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          aria-label="Revoke role"
                          onClick={() => confirmRevoke(role)}
                        >
                          <Trash2 size={16} />
                        </ActionIcon>
                      </Tooltip>
                    ) : null}
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Stack>

      <Stack gap="md">
        <Title order={5}>Effective permissions</Title>
        <Text size="sm" c="dimmed">
          Unique permissions from active direct roles and roles inherited from
          active groups. Inactive groups and inactive roles do not grant access.
        </Text>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Code</Table.Th>
              <Table.Th>Name</Table.Th>
              <Table.Th>Module</Table.Th>
              <Table.Th>Operation</Table.Th>
              <Table.Th>Source</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {permissionsLoading && permissions.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text size="sm" c="dimmed">
                    Loading permissions…
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : permissions.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text size="sm" c="dimmed">
                    No effective permissions yet.
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              permissions.map((permission) => (
                <Table.Tr key={permission.permissionId}>
                  <Table.Td>
                    <Badge variant="light" color="neutral" tt="uppercase">
                      {permission.permissionCode}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{permission.permissionName}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{permission.moduleCode}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="outline" color="neutral">
                      {permission.operation}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      {permission.sources.map((source) => (
                        <Badge
                          key={source}
                          variant="light"
                          color={source === 'DIRECT' ? 'blue' : 'violet'}
                        >
                          {source === 'DIRECT' ? 'Direct' : 'Group'}
                        </Badge>
                      ))}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Stack>

      <AssignRoleModal
        opened={assignOpened}
        onClose={() => setAssignOpened(false)}
        userId={userId}
        tenantId={tenantId}
        assignedRoleIds={roles
          .filter((role) => role.source === 'DIRECT')
          .map((role) => role.roleId)}
      />
    </Stack>
  )
}

function AssignRoleModal({
  opened,
  onClose,
  userId,
  tenantId,
  assignedRoleIds,
}: {
  opened: boolean
  onClose: () => void
  userId: string
  tenantId: string | null
  assignedRoleIds: string[]
}) {
  const [roleId, setRoleId] = useState<string | null>(null)
  const [assignRole, { isLoading }] = useAssignUserRoleMutation()
  const { data: roles = [], isLoading: rolesLoading } =
    useGetAssignableRolesQuery(tenantId ?? undefined, { skip: !opened })

  const assigned = useMemo(() => new Set(assignedRoleIds), [assignedRoleIds])
  const assignable = Array.isArray(roles) ? roles : []
  const options = assignable
    .filter((role) => !assigned.has(role.roleId))
    .map((role) => ({
      value: role.roleId,
      label: `${role.roleName} (${role.roleCode})${role.isSystemRole ? ' · system' : ''}`,
    }))

  async function handleAssign() {
    if (!roleId) return
    try {
      await assignRole({ userId, roleId }).unwrap()
      notify({
        type: 'success',
        title: 'Role assigned',
        message: 'The selected role is now assigned to this user.',
      })
      setRoleId(null)
      onClose()
    } catch {
      // Shared base query shows API errors.
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Assign role" centered>
      <Stack>
        <Select
          label="Role"
          placeholder="Select a role"
          data={options}
          value={roleId}
          onChange={setRoleId}
          searchable
          disabled={rolesLoading}
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAssign} loading={isLoading} disabled={!roleId}>
            Assign
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
