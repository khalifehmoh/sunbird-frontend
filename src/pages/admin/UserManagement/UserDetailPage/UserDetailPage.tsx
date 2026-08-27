import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Code,
  Group,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Tabs,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { modals } from '@mantine/modals'
import { notify } from '../../../../lib/notify'
import dayjs from 'dayjs'
import {
  ArrowLeft,
  KeyRound,
  Lock,
  Pencil,
  Shield,
  Unlock,
  UserRound,
} from 'lucide-react'
import {
  useGetUserQuery,
  usePatchUserStatusMutation,
  useResetUserPasswordMutation,
} from '../../../../redux/features/users/usersApi'
import type { UserStatus } from '../../../../redux/features/users/usersTypes'
import { StatusBadge } from '../../../../components/StatusBadge/StatusBadge'
import { usePermissions } from '../../../../hooks/usePermissions'
import { Permission } from '../../../../constants/permissions'
import {
  USER_STATUS_COLORS,
  userDisplayName,
  userInitials,
} from '../userConstants'
import { UserForm } from '../UserForm/UserForm'
import { UserGroupsTab } from '../UserGroupsTab/UserGroupsTab'
import { UserRolesTab } from '../UserRolesTab/UserRolesTab'
import { UserSessionsTable } from '../UserSessionsTable/UserSessionsTable'

type DetailTab =
  | 'profile'
  | 'roles'
  | 'groups'
  | 'access'
  | 'sessions'

const DETAIL_TABS: DetailTab[] = [
  'profile',
  'roles',
  'groups',
  'access',
  'sessions',
]

function parseDetailTab(value: string | null): DetailTab | null {
  return DETAIL_TABS.includes(value as DetailTab) ? (value as DetailTab) : null
}

function DetailField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <Stack gap={3}>
      <Text size="xs" tt="uppercase" fw={700} c="dimmed">
        {label}
      </Text>
      <Text size="sm">{children}</Text>
    </Stack>
  )
}

function StubTab({ title, description }: { title: string; description: string }) {
  return (
    <Alert color="gray" title={title}>
      {description}
    </Alert>
  )
}

export function UserDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<DetailTab>(
    parseDetailTab(searchParams.get('tab')) ?? 'profile',
  )
  const [formOpened, setFormOpened] = useState(
    searchParams.get('edit') === 'true',
  )

  const canRead = usePermissions(Permission.USER_READ)
  const canUpdate = usePermissions(Permission.USER_UPDATE)

  const {
    data: user,
    isLoading,
    isError,
  } = useGetUserQuery(id, { skip: !id || !canRead })

  const [patchStatus, { isLoading: statusUpdating }] =
    usePatchUserStatusMutation()
  const [resetPassword, { isLoading: resetLoading }] =
    useResetUserPasswordMutation()

  useEffect(() => {
    const tab = parseDetailTab(searchParams.get('tab'))
    if (tab) {
      setActiveTab(tab)
    }
    if (searchParams.get('edit') === 'true') {
      setFormOpened(true)
    }
  }, [searchParams])

  function changeTab(value: string | null) {
    const next = parseDetailTab(value) ?? 'profile'
    setActiveTab(next)
    const params = new URLSearchParams(searchParams)
    if (next === 'profile') {
      params.delete('tab')
    } else {
      params.set('tab', next)
    }
    setSearchParams(params, { replace: true })
  }

  function closeForm() {
    setFormOpened(false)
    if (searchParams.get('edit') === 'true') {
      const next = new URLSearchParams(searchParams)
      next.delete('edit')
      setSearchParams(next, { replace: true })
    }
  }

  function confirmStatusChange(nextStatus: UserStatus) {
    if (!user || nextStatus === user.status) return
    modals.openConfirmModal({
      title: 'Change user status',
      children: (
        <Text size="sm">
          Change <strong>{userDisplayName(user)}</strong> from{' '}
          <strong>{user.status}</strong> to <strong>{nextStatus}</strong>?
        </Text>
      ),
      labels: { confirm: 'Change status', cancel: 'Cancel' },
      confirmProps: { color: nextStatus === 'ACTIVE' ? 'teal' : 'orange' },
      onConfirm: async () => {
        try {
          await patchStatus({ userId: id, status: nextStatus }).unwrap()
          notify({
            type: 'success',
            title: 'Status updated',
            message: `${userDisplayName(user)} is now ${nextStatus}.`,
          })
        } catch {
          // Shared base query shows API errors.
        }
      },
    })
  }

  function confirmResetPassword() {
    if (!user) return
    modals.openConfirmModal({
      title: 'Reset password',
      children: (
        <Text size="sm">
          Reset password for <strong>{userDisplayName(user)}</strong>? Active
          sessions will be terminated.
        </Text>
      ),
      labels: { confirm: 'Reset', cancel: 'Cancel' },
      confirmProps: { color: 'orange' },
      onConfirm: async () => {
        try {
          const result = await resetPassword(id).unwrap()
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

  if (!canRead) {
    return (
      <Box p="xl">
        <Text>You don&apos;t have permission to view users.</Text>
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

  if (isError || !user) {
    return (
      <Box p="xl">
        <Stack gap="md">
          <Button
            variant="subtle"
            leftSection={<ArrowLeft size={16} />}
            onClick={() => navigate('/admin/users')}
            w="fit-content"
            px={0}
          >
            Back to users
          </Button>
          <Alert color="red" title="User not found">
            The user could not be loaded. It may have been deleted or you may
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
          onClick={() => navigate('/admin/users')}
          w="fit-content"
          px={0}
        >
          Back to users
        </Button>

        <Paper withBorder radius="md" p="lg">
          <Group justify="space-between" align="flex-start" wrap="wrap">
            <Group align="flex-start" gap="md">
              <Avatar size={56} radius="md" color="blue">
                {userInitials(user)}
              </Avatar>
              <Stack gap={5}>
                <Group gap="sm">
                  <Title order={2}>{userDisplayName(user)}</Title>
                  <StatusBadge
                    value={user.status}
                    colorMap={USER_STATUS_COLORS}
                  />
                </Group>
                {user.fullNameAr ? (
                  <Text c="dimmed" dir="rtl" w="fit-content">
                    {user.fullNameAr}
                  </Text>
                ) : null}
                <Group gap="xs">
                  <Badge variant="light">
                    <Code>{user.username}</Code>
                  </Badge>
                  <Badge variant="outline" color="neutral">
                    {user.role}
                  </Badge>
                  {user.mfaEnabled ? (
                    <Badge
                      variant="light"
                      color="teal"
                      leftSection={<Shield size={12} />}
                    >
                      MFA
                    </Badge>
                  ) : null}
                </Group>
              </Stack>
            </Group>

            {canUpdate ? (
              <Group>
                {user.status === 'LOCKED' ? (
                  <Button
                    variant="light"
                    color="teal"
                    leftSection={<Unlock size={17} />}
                    loading={statusUpdating}
                    onClick={() => confirmStatusChange('ACTIVE')}
                  >
                    Unlock
                  </Button>
                ) : (
                  <Button
                    variant="light"
                    color="orange"
                    leftSection={<Lock size={17} />}
                    loading={statusUpdating}
                    onClick={() => confirmStatusChange('LOCKED')}
                  >
                    Lock
                  </Button>
                )}
                <Button
                  variant="light"
                  color="gray"
                  leftSection={<KeyRound size={17} />}
                  loading={resetLoading}
                  onClick={confirmResetPassword}
                >
                  Reset password
                </Button>
                <Button
                  variant="light"
                  leftSection={<Pencil size={17} />}
                  onClick={() => setFormOpened(true)}
                >
                  Edit
                </Button>
              </Group>
            ) : null}
          </Group>
        </Paper>

        <Paper withBorder radius="md" p="md">
          <Tabs value={activeTab} onChange={changeTab}>
            <Tabs.List>
              <Tabs.Tab value="profile">Profile</Tabs.Tab>
              <Tabs.Tab value="roles">Roles</Tabs.Tab>
              <Tabs.Tab value="groups">Groups</Tabs.Tab>
              <Tabs.Tab value="access">Tenant Access</Tabs.Tab>
              <Tabs.Tab value="sessions">Sessions</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="profile" pt="md">
              <Stack gap="lg">
                <Group gap="xs">
                  <ThemeIcon variant="light" size="sm">
                    <UserRound size={14} />
                  </ThemeIcon>
                  <Title order={4}>Profile</Title>
                </Group>
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                  <DetailField label="Email">{user.email}</DetailField>
                  <DetailField label="Username">
                    <Code>{user.username}</Code>
                  </DetailField>
                  <DetailField label="Role">{user.role}</DetailField>
                  <DetailField label="First name (EN)">
                    {user.firstName ?? '—'}
                  </DetailField>
                  <DetailField label="Last name (EN)">
                    {user.lastName ?? '—'}
                  </DetailField>
                  <DetailField label="Tenant">
                    {user.tenantName ?? '—'}
                  </DetailField>
                  <DetailField label="First name (AR)">
                    <span dir="rtl">{user.firstNameAr ?? '—'}</span>
                  </DetailField>
                  <DetailField label="Last name (AR)">
                    <span dir="rtl">{user.lastNameAr ?? '—'}</span>
                  </DetailField>
                  <DetailField label="Last login">
                    {user.lastLoginAt
                      ? dayjs(user.lastLoginAt).format('MMM D, YYYY h:mm A')
                      : 'Never'}
                  </DetailField>
                  <DetailField label="Last login IP">
                    {user.lastLoginIp ?? '—'}
                  </DetailField>
                  <DetailField label="Require password change">
                    {user.requirePasswordChange ? 'Yes' : 'No'}
                  </DetailField>
                  <DetailField label="Created">
                    {user.createdAt
                      ? dayjs(user.createdAt).format('MMM D, YYYY')
                      : '—'}
                  </DetailField>
                </SimpleGrid>
                <Button
                  component={Link}
                  to={`/admin/users/${id}/sessions`}
                  variant="subtle"
                  w="fit-content"
                  px={0}
                >
                  Open full sessions page
                </Button>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="roles" pt="md">
              <UserRolesTab
                userId={id}
                tenantId={user.tenantId}
                enabled={activeTab === 'roles'}
              />
            </Tabs.Panel>

            <Tabs.Panel value="groups" pt="md">
              <UserGroupsTab
                userId={id}
                tenantId={user.tenantId}
                enabled={activeTab === 'groups'}
              />
            </Tabs.Panel>

            <Tabs.Panel value="access" pt="md">
              <StubTab
                title="Tenant access coming soon"
                description="Cross-tenant access grants will be available in a later release."
              />
            </Tabs.Panel>

            <Tabs.Panel value="sessions" pt="md">
              <UserSessionsTable userId={id} />
            </Tabs.Panel>
          </Tabs>
        </Paper>
      </Stack>

      <UserForm opened={formOpened} onClose={closeForm} userId={id} />
    </Box>
  )
}
