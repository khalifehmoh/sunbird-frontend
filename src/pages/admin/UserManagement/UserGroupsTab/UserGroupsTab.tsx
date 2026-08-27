import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ActionIcon,
  Button,
  Group,
  Modal,
  Stack,
  Table,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import { notify } from '../../../../lib/notify'
import { Plus, Search, Trash2 } from 'lucide-react'
import {
  useAddGroupMemberMutation,
  useGetGroupsQuery,
  useRemoveGroupMemberMutation,
} from '../../../../redux/features/groups/groupsApi'
import { useGetUserGroupsQuery } from '../../../../redux/features/users/usersApi'
import type { UserGroupItem } from '../../../../redux/features/users/usersTypes'
import { StatusBadge } from '../../../../components/StatusBadge/StatusBadge'
import { usePermissions } from '../../../../hooks/usePermissions'
import { GROUP_STATUS_COLORS } from '../../GroupManagement/groupConstants'

export function UserGroupsTab({
  userId,
  tenantId,
  enabled,
}: {
  userId: string
  tenantId: string | null
  enabled: boolean
}) {
  const navigate = useNavigate()
  const [addOpened, setAddOpened] = useState(false)
  const canUpdate = usePermissions('GROUP:UPDATE')

  const { data: groups = [], isFetching: groupsLoading } = useGetUserGroupsQuery(
    userId,
    { skip: !userId || (!enabled && !addOpened) },
  )
  const [removeFromGroup] = useRemoveGroupMemberMutation()

  function confirmRemove(group: UserGroupItem) {
    modals.openConfirmModal({
      title: 'Remove from group',
      children: (
        <Text size="sm">
          Remove this user from <strong>{group.groupName}</strong>?
        </Text>
      ),
      labels: { confirm: 'Remove', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await removeFromGroup({
            userId,
            groupId: group.groupId,
          }).unwrap()
          notify({
            type: 'success',
            title: 'Removed from group',
            message: `This user is no longer in ${group.groupName}.`,
          })
        } catch {
          // Shared base query shows API errors.
        }
      },
    })
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" wrap="nowrap" align="center" gap="xl">
        <Text size="sm" c="dimmed" style={{ flex: 1, minWidth: 0 }}>
          Group memberships, including inactive groups. Only active groups grant
          inherited roles; reactivating a group restores that access.
        </Text>
        {canUpdate ? (
          <Button
            size="sm"
            leftSection={<Plus size={16} />}
            onClick={() => setAddOpened(true)}
            disabled={!tenantId}
            style={{ flexShrink: 0 }}
          >
            Add to group
          </Button>
        ) : null}
      </Group>
      {!tenantId ? (
        <Text size="sm" c="dimmed">
          This user has no tenant, so they cannot join tenant groups.
        </Text>
      ) : null}
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Code</Table.Th>
            <Table.Th>Name</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th ta="right">Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {groupsLoading && groups.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={4}>
                <Text size="sm" c="dimmed">
                  Loading groups…
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : groups.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={4}>
                <Text size="sm" c="dimmed">
                  Not a member of any groups yet.
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            groups.map((group) => (
              <Table.Tr
                key={group.memberId}
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/admin/groups/${group.groupId}`)}
              >
                <Table.Td>
                  <Text size="sm" tt="uppercase">
                    {group.groupCode}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Stack gap={2}>
                    <Text size="sm" fw={500}>
                      {group.groupName}
                    </Text>
                    {group.groupNameAr ? (
                      <Text size="xs" c="dimmed" dir="rtl">
                        {group.groupNameAr}
                      </Text>
                    ) : null}
                  </Stack>
                </Table.Td>
                <Table.Td>
                  <StatusBadge
                    value={group.status}
                    colorMap={GROUP_STATUS_COLORS}
                  />
                </Table.Td>
                <Table.Td
                  ta="right"
                  onClick={(event) => event.stopPropagation()}
                >
                  {canUpdate ? (
                    <Tooltip label="Remove from group">
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        aria-label="Remove from group"
                        onClick={() => confirmRemove(group)}
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

      <AddToGroupModal
        opened={addOpened}
        onClose={() => setAddOpened(false)}
        userId={userId}
        tenantId={tenantId}
        memberGroupIds={groups.map((group) => group.groupId)}
      />
    </Stack>
  )
}

function AddToGroupModal({
  opened,
  onClose,
  userId,
  tenantId,
  memberGroupIds,
}: {
  opened: boolean
  onClose: () => void
  userId: string
  tenantId: string | null
  memberGroupIds: string[]
}) {
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebouncedValue(search, 300)
  const [addToGroup, { isLoading }] = useAddGroupMemberMutation()

  const { data, isFetching } = useGetGroupsQuery(
    {
      page: 0,
      size: 20,
      search: debouncedSearch,
      status: 'ACTIVE',
      tenantId: tenantId ?? undefined,
      sort: 'groupName:asc',
    },
    { skip: !opened || !tenantId },
  )

  const memberSet = useMemo(() => new Set(memberGroupIds), [memberGroupIds])
  const candidates = (data?.content ?? []).filter(
    (group) => !memberSet.has(group.groupId),
  )

  async function handleAdd(groupId: string, name: string) {
    try {
      await addToGroup({ userId, groupId }).unwrap()
      notify({
        type: 'success',
        title: 'Added to group',
        message: `This user was added to ${name}.`,
      })
    } catch {
      // Shared base query shows API errors.
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Add to group" centered>
      <Stack>
        <TextInput
          label="Search groups"
          placeholder="Name or code"
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
            No matching groups in this tenant.
          </Text>
        ) : (
          <Stack gap={0}>
            {candidates.map((group, index) => (
              <Group
                key={group.groupId}
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
                    {group.groupName}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {group.groupCode}
                  </Text>
                </Stack>
                <Button
                  size="xs"
                  loading={isLoading}
                  onClick={() => handleAdd(group.groupId, group.groupName)}
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
