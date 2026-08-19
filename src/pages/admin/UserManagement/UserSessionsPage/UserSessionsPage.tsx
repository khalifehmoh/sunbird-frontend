import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Group,
  Paper,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { ArrowLeft } from 'lucide-react'
import { useGetUserQuery } from '../../../../redux/features/users/usersApi'
import { usePermissions } from '../../../../hooks/usePermissions'
import { userDisplayName } from '../userConstants'
import { UserSessionsTable } from '../UserSessionsTable/UserSessionsTable'

export function UserSessionsPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const canRead = usePermissions('USER:READ')

  const {
    data: user,
    isLoading,
    isError,
  } = useGetUserQuery(id, { skip: !id || !canRead })

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
          <Skeleton height={28} width={200} />
          <Skeleton height={280} radius="md" />
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
            Sessions cannot be loaded for this user.
          </Alert>
        </Stack>
      </Box>
    )
  }

  return (
    <Box p="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Stack gap={4}>
            <Button
              variant="subtle"
              leftSection={<ArrowLeft size={16} />}
              component={Link}
              to={`/admin/users/${id}`}
              w="fit-content"
              px={0}
            >
              Back to user
            </Button>
            <Title order={2}>Sessions</Title>
            <Text c="dimmed" size="sm">
              Active and historical sessions for {userDisplayName(user)} (
              {user.username})
            </Text>
          </Stack>
        </Group>

        <Paper withBorder radius="md" p="md">
          <UserSessionsTable userId={id} />
        </Paper>
      </Stack>
    </Box>
  )
}
