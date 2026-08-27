import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Group,
  Modal,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import { notify } from '../../../../lib/notify'
import { ArrowLeft, Pencil, Plus, Search, Shield, Trash2, Users } from 'lucide-react'
import {
  useAddGroupMemberMutation,
  useAssignGroupRoleMutation,
  useGetAssignableRolesQuery,
  useGetGroupMembersQuery,
  useGetGroupQuery,
  useGetGroupRolesQuery,
  useRemoveGroupMemberMutation,
  useRevokeGroupRoleMutation,
} from '../../../../redux/features/groups/groupsApi'
import type { GroupRoleItem } from '../../../../redux/features/groups/groupsTypes'
import { useGetUsersQuery } from '../../../../redux/features/users/usersApi'
import { userDisplayName } from '../../UserManagement/userConstants'
import { StatusBadge } from '../../../../components/StatusBadge/StatusBadge'
import { usePermissions } from '../../../../hooks/usePermissions'
import { GROUP_STATUS_COLORS } from '../groupConstants'
import { GroupForm } from '../GroupForm/GroupForm'

type DetailTab = 'members' | 'roles'

export function GroupDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<DetailTab>(
    searchParams.get('tab') === 'roles' ? 'roles' : 'members',
  )
  const [formOpened, setFormOpened] = useState(false)
  const [addMemberOpened, setAddMemberOpened] = useState(false)
  const [assignRoleOpened, setAssignRoleOpened] = useState(false)

  const canRead = usePermissions('GROUP:READ')
  const canUpdate = usePermissions('GROUP:UPDATE')
  const canAssignRole = usePermissions('ASSIGN_ROLE')
  const canRevokeRole = usePermissions('REVOKE_ROLE')

  const {
    data: group,
    isLoading,
    isError,
  } = useGetGroupQuery(id, { skip: !id || !canRead })

  const { data: members = [], isFetching: membersLoading } =
    useGetGroupMembersQuery(id, {
      skip: !id || !canRead || (activeTab !== 'members' && !addMemberOpened),
    })
  const { data: roles = [], isFetching: rolesLoading } = useGetGroupRolesQuery(
    id,
    {
      skip: !id || !canRead || (activeTab !== 'roles' && !assignRoleOpened),
    },
  )

  const [removeMember] = useRemoveGroupMemberMutation()
  const [revokeRole] = useRevokeGroupRoleMutation()

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'roles' || tab === 'members') {
      setActiveTab(tab)
    }
  }, [searchParams])

  function changeTab(value: string | null) {
    const next = value === 'roles' ? 'roles' : 'members'
    setActiveTab(next)
    const params = new URLSearchParams(searchParams)
    params.set('tab', next)
    setSearchParams(params, { replace: true })
  }

  function confirmRemoveMember(userId: string, name: string) {
    modals.openConfirmModal({
      title: 'Remove member',
      children: (
        <Text size="sm">
          Remove <strong>{name}</strong> from this group?
        </Text>
      ),
      labels: { confirm: 'Remove', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await removeMember({ groupId: id, userId }).unwrap()
          notify({
            type: 'success',
            title: 'Member removed',
            message: `${name} is no longer in this group.`,
          })
        } catch {
          // Shared base query shows API errors.
        }
      },
    })
  }

  function confirmRevokeRole(role: GroupRoleItem) {
    modals.openConfirmModal({
      title: 'Revoke role',
      children: (
        <Text size="sm">
          Revoke <strong>{role.roleName}</strong> from this group?{' '}
          {role.inheritedMemberCount} user
          {role.inheritedMemberCount === 1 ? '' : 's'} currently inherit this
          role through the group.
        </Text>
      ),
      labels: { confirm: 'Revoke', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await revokeRole({ groupId: id, roleId: role.roleId }).unwrap()
          notify({
            type: 'success',
            title: 'Role revoked',
            message: `${role.roleName} is no longer assigned to this group.`,
          })
        } catch {
          // Shared base query shows API errors.
        }
      },
    })
  }

  if (!canRead) {
    return (
      <Box p="xl">
        <Text>You don&apos;t have permission to view groups.</Text>
      </Box>
    )
  }

  if (isLoading) {
    return (
      <Box p="xl">
        <Stack gap="md">
          <Skeleton height={28} width={160} />
          <Skeleton height={120} radius="md" />
          <Skeleton height={320} radius="md" />
        </Stack>
      </Box>
    )
  }

  if (isError || !group) {
    return (
      <Box p="xl">
        <Stack gap="md">
          <Button
            variant="subtle"
            leftSection={<ArrowLeft size={16} />}
            onClick={() => navigate('/admin/groups')}
            w="fit-content"
            px={0}
          >
            Back to groups
          </Button>
          <Alert color="red" title="Group not found">
            The group could not be loaded. It may have been deleted or you may
            not have access.
          </Alert>
        </Stack>
      </Box>
    )
  }

  return (
    <Box p="xl">
      <Stack gap="lg">
        <Button
          variant="subtle"
          leftSection={<ArrowLeft size={16} />}
          onClick={() => navigate('/admin/groups')}
          w="fit-content"
          px={0}
        >
          Back to groups
        </Button>

        <Paper withBorder radius="md" p="lg">
          <Group justify="space-between" align="flex-start" wrap="wrap">
            <Stack gap={6}>
              <Group gap="sm">
                <Title order={2}>{group.groupName}</Title>
                <StatusBadge
                  value={group.status}
                  colorMap={GROUP_STATUS_COLORS}
                />
              </Group>
              {group.groupNameAr ? (
                <Text c="dimmed" dir="rtl" w="fit-content">
                  {group.groupNameAr}
                </Text>
              ) : null}
              <Group gap="xs">
                <Badge variant="light" color="violet" tt="uppercase">
                  {group.groupCode}
                </Badge>
                <Badge variant="outline" color="neutral" leftSection={<Users size={12} />}>
                  {group.memberCount} members
                </Badge>
                <Badge variant="outline" color="neutral" leftSection={<Shield size={12} />}>
                  {group.roleCount} roles
                </Badge>
              </Group>
              {group.groupDescription ? (
                <Text size="sm" c="dimmed" maw={640}>
                  {group.groupDescription}
                </Text>
              ) : null}
            </Stack>
            {canUpdate ? (
              <Button
                variant="light"
                leftSection={<Pencil size={17} />}
                onClick={() => setFormOpened(true)}
              >
                Edit
              </Button>
            ) : null}
          </Group>
        </Paper>

        <Paper withBorder radius="md" p="md">
          <Tabs value={activeTab} onChange={changeTab}>
            <Tabs.List>
              <Tabs.Tab value="members">Members</Tabs.Tab>
              <Tabs.Tab value="roles">Roles</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="members" pt="md">
              <Stack gap="md">
                <Group justify="space-between" wrap="nowrap" align="center" gap="xl">
                  <Text size="sm" c="dimmed" style={{ flex: 1, minWidth: 0 }}>
                    Users in this group inherit every assigned role.
                  </Text>
                  {canUpdate ? (
                    <Button
                      size="sm"
                      leftSection={<Plus size={16} />}
                      onClick={() => setAddMemberOpened(true)}
                      style={{ flexShrink: 0 }}
                    >
                      Add member
                    </Button>
                  ) : null}
                </Group>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Name</Table.Th>
                      <Table.Th>Username</Table.Th>
                      <Table.Th>Email</Table.Th>
                      <Table.Th ta="right">Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {membersLoading && members.length === 0 ? (
                      <Table.Tr>
                        <Table.Td colSpan={4}>
                          <Text size="sm" c="dimmed">
                            Loading members…
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ) : members.length === 0 ? (
                      <Table.Tr>
                        <Table.Td colSpan={4}>
                          <Text size="sm" c="dimmed">
                            No members yet.
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ) : (
                      members.map((member) => (
                        <Table.Tr
                          key={member.memberId}
                          style={{ cursor: 'pointer' }}
                          onClick={() =>
                            navigate(`/admin/users/${member.userId}`)
                          }
                        >
                          <Table.Td>
                            <Text size="sm" fw={500}>
                              {member.fullName || member.username}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{member.username}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{member.email}</Text>
                          </Table.Td>
                          <Table.Td
                            ta="right"
                            onClick={(event) => event.stopPropagation()}
                          >
                            {canUpdate ? (
                              <Tooltip label="Remove member">
                                <ActionIcon
                                  variant="subtle"
                                  color="red"
                                  aria-label="Remove member"
                                  onClick={() =>
                                    confirmRemoveMember(
                                      member.userId,
                                      member.fullName || member.username,
                                    )
                                  }
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
            </Tabs.Panel>

            <Tabs.Panel value="roles" pt="md">
              <Stack gap="md">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Roles assigned here are inherited by every group member.
                  </Text>
                  {canAssignRole ? (
                    <Button
                      size="sm"
                      leftSection={<Plus size={16} />}
                      onClick={() => setAssignRoleOpened(true)}
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
                      <Table.Th ta="right">Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {rolesLoading && roles.length === 0 ? (
                      <Table.Tr>
                        <Table.Td colSpan={4}>
                          <Text size="sm" c="dimmed">
                            Loading roles…
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ) : roles.length === 0 ? (
                      <Table.Tr>
                        <Table.Td colSpan={4}>
                          <Text size="sm" c="dimmed">
                            No roles assigned yet.
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ) : (
                      roles.map((role) => (
                        <Table.Tr
                          key={role.groupRoleId}
                          style={{ cursor: 'pointer' }}
                          onClick={() =>
                            navigate(
                              `/admin/roles/${role.roleId}/permissions`,
                            )
                          }
                        >
                          <Table.Td>
                            <Badge variant="light" color="neutral" tt="uppercase">
                              {role.roleCode}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Tooltip
                              label={`${role.inheritedMemberCount} users inherit this role through this group.`}
                            >
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
                            </Tooltip>
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              variant="outline"
                              color={role.isSystemRole ? 'blue' : 'neutral'}
                            >
                              {role.isSystemRole ? 'System' : 'Tenant'}
                            </Badge>
                          </Table.Td>
                          <Table.Td
                            ta="right"
                            onClick={(event) => event.stopPropagation()}
                          >
                            {canRevokeRole ? (
                              <Tooltip label="Revoke role">
                                <ActionIcon
                                  variant="subtle"
                                  color="red"
                                  aria-label="Revoke role"
                                  onClick={() => confirmRevokeRole(role)}
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
            </Tabs.Panel>
          </Tabs>
        </Paper>
      </Stack>

      <GroupForm
        opened={formOpened}
        onClose={() => setFormOpened(false)}
        groupId={id}
      />
      <AddMemberModal
        opened={addMemberOpened}
        onClose={() => setAddMemberOpened(false)}
        groupId={id}
        tenantId={group.tenantId}
        memberUserIds={members.map((member) => member.userId)}
      />
      <AssignRoleModal
        opened={assignRoleOpened}
        onClose={() => setAssignRoleOpened(false)}
        groupId={id}
        tenantId={group.tenantId}
        assignedRoleIds={roles.map((role) => role.roleId)}
      />
    </Box>
  )
}

function AddMemberModal({
  opened,
  onClose,
  groupId,
  tenantId,
  memberUserIds,
}: {
  opened: boolean
  onClose: () => void
  groupId: string
  tenantId: string
  memberUserIds: string[]
}) {
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebouncedValue(search, 300)
  const [addMember, { isLoading }] = useAddGroupMemberMutation()

  const { data, isFetching } = useGetUsersQuery(
    {
      page: 0,
      size: 20,
      search: debouncedSearch,
      status: 'ACTIVE',
      tenantId,
      sort: 'username:asc',
    },
    { skip: !opened || !tenantId },
  )

  const memberSet = useMemo(() => new Set(memberUserIds), [memberUserIds])
  const candidates = (data?.content ?? []).filter(
    (user) => !memberSet.has(user.userId),
  )

  async function handleAdd(userId: string, name: string) {
    try {
      await addMember({ groupId, userId }).unwrap()
      notify({
        type: 'success',
        title: 'Member added',
        message: `${name} was added to the group.`,
      })
    } catch {
      // Shared base query shows API errors.
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Add member" centered>
      <Stack>
        <TextInput
          label="Search users"
          placeholder="Name, username, or email"
          leftSection={<Search size={16} />}
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
        />
        {isFetching && candidates.length === 0 ? (
          <Text size="sm" c="dimmed">
            Searching…
          </Text>
        ) : candidates.length === 0 ? (
          <Text size="sm" c="dimmed">
            No matching users in this tenant.
          </Text>
        ) : (
          <Stack gap={0}>
            {candidates.map((user, index) => (
              <Group
                key={user.userId}
                justify="space-between"
                wrap="nowrap"
                gap="xl"
                py="sm"
                style={{
                  borderBottom:
                    index < candidates.length - 1
                      ? '1px solid var(--mantine-color-default-border)'
                      : undefined,
                }}
              >
                <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                  <Text size="sm" fw={500} truncate>
                    {userDisplayName(user)}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {user.username.toLowerCase() === user.email.toLowerCase()
                      ? user.email
                      : `${user.username} · ${user.email}`}
                  </Text>
                </Stack>
                <Button
                  size="xs"
                  loading={isLoading}
                  onClick={() => handleAdd(user.userId, userDisplayName(user))}
                  style={{ flexShrink: 0 }}
                >
                  Add
                </Button>
              </Group>
            ))}
          </Stack>
        )}
      </Stack>
    </Modal>
  )
}

function AssignRoleModal({
  opened,
  onClose,
  groupId,
  tenantId,
  assignedRoleIds,
}: {
  opened: boolean
  onClose: () => void
  groupId: string
  tenantId: string
  assignedRoleIds: string[]
}) {
  const [roleId, setRoleId] = useState<string | null>(null)
  const [assignRole, { isLoading }] = useAssignGroupRoleMutation()
  const { data: roles = [], isLoading: rolesLoading } =
    useGetAssignableRolesQuery(tenantId, { skip: !opened || !tenantId })

  const assigned = useMemo(() => new Set(assignedRoleIds), [assignedRoleIds])
  const options = roles
    .filter((role) => !assigned.has(role.roleId))
    .map((role) => ({
      value: role.roleId,
      label: `${role.roleName} (${role.roleCode})${role.isSystemRole ? ' · system' : ''}`,
    }))

  async function handleAssign() {
    if (!roleId) return
    try {
      await assignRole({ groupId, roleId }).unwrap()
      notify({
        type: 'success',
        title: 'Role assigned',
        message: 'Members of this group now inherit the selected role.',
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
