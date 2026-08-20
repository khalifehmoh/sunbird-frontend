import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Badge,
  Box,
  Button,
  Code,
  Group,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import dayjs from 'dayjs'
import { useGetAuditEventQuery } from '../../../../redux/features/audit/auditApi'
import { usePermissions } from '../../../../hooks/usePermissions'
import { formatUserAgent } from '../../../../utils/userAgent'
import { auditActionColor, entityPath } from '../auditConstants'

function JsonBlock({
  label,
  value,
}: {
  label: string
  value: Record<string, unknown> | null
}) {
  return (
    <Paper withBorder radius="md" p="md">
      <Text size="xs" tt="uppercase" fw={700} c="dimmed" mb="xs">
        {label}
      </Text>
      {value ? (
        <Code block style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {JSON.stringify(value, null, 2)}
        </Code>
      ) : (
        <Text size="sm" c="dimmed">
          None
        </Text>
      )}
    </Paper>
  )
}

export function AuditDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const canRead = usePermissions('AUDIT:READ')
  const { data: event, isLoading, isError } = useGetAuditEventQuery(id, {
    skip: !id || !canRead,
  })

  if (!canRead) {
    return (
      <Box p="xl">
        <Text>You don&apos;t have permission to view audit logs.</Text>
      </Box>
    )
  }

  if (isLoading) {
    return (
      <Box p="xl">
        <Stack gap="md">
          <Skeleton height={28} width={220} />
          <Skeleton height={180} radius="md" />
          <Skeleton height={220} radius="md" />
        </Stack>
      </Box>
    )
  }

  if (isError || !event) {
    return (
      <Box p="xl">
        <Stack gap="md">
          <Button
            variant="subtle"
            leftSection={<ArrowLeft size={16} />}
            onClick={() => navigate('/admin/audit')}
            w="fit-content"
            px={0}
          >
            Back to audit log
          </Button>
          <Alert color="red" title="Audit event not found">
            This event may have been outside your tenant scope, or the id is
            invalid.
          </Alert>
        </Stack>
      </Box>
    )
  }

  const targetHref = entityPath(event.entityType, event.entityId)
  const showDiff = event.actionType === 'UPDATE'

  return (
    <Box p="xl">
      <Stack gap="lg">
        <Stack gap={4}>
          <Button
            variant="subtle"
            leftSection={<ArrowLeft size={16} />}
            component={Link}
            to="/admin/audit"
            w="fit-content"
            px={0}
          >
            Back to audit log
          </Button>
          <Group gap="sm">
            <Title order={2}>Audit event</Title>
            <Badge
              color={auditActionColor(event.actionType)}
              variant="light"
              tt="uppercase"
            >
              {event.actionType}
            </Badge>
            {event.success ? (
              <Badge color="teal" variant="light">
                Success
              </Badge>
            ) : (
              <Badge color="red" variant="light">
                Failed
              </Badge>
            )}
          </Group>
          <Text c="dimmed" size="sm">
            {event.auditId}
          </Text>
        </Stack>

        <Paper withBorder radius="md" p="lg">
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            <Stack gap={2}>
              <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                Timestamp
              </Text>
              <Text size="sm">
                {event.createdAt
                  ? dayjs(event.createdAt).format('MMM D, YYYY h:mm:ss A')
                  : '—'}
              </Text>
            </Stack>
            <Stack gap={2}>
              <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                User
              </Text>
              {event.userId ? (
                <Text
                  size="sm"
                  component={Link}
                  to={`/admin/users/${event.userId}`}
                  fw={500}
                >
                  {event.userFullName ?? event.username}
                  {event.username ? ` (${event.username})` : ''}
                </Text>
              ) : (
                <Text size="sm" c="dimmed" fs="italic">
                  System
                </Text>
              )}
            </Stack>
            <Stack gap={2}>
              <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                Entity
              </Text>
              <Text size="sm">
                {event.entityType}
                {event.entityName ? ` · ${event.entityName}` : ''}
              </Text>
              {targetHref ? (
                <Button
                  component={Link}
                  to={targetHref}
                  variant="subtle"
                  size="compact-sm"
                  px={0}
                  rightSection={<ExternalLink size={12} />}
                  w="fit-content"
                >
                  View entity
                </Button>
              ) : null}
            </Stack>
            <Stack gap={2}>
              <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                IP address
              </Text>
              <Text size="sm">{event.ipAddress ?? '—'}</Text>
            </Stack>
            <Stack gap={2}>
              <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                Browser
              </Text>
              <Text size="sm">{formatUserAgent(event.userAgent)}</Text>
            </Stack>
            <Stack gap={2}>
              <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                Tenant
              </Text>
              <Text size="sm">{event.tenantName ?? '—'}</Text>
            </Stack>
          </SimpleGrid>
          {event.errorMessage ? (
            <Alert color="red" mt="md" title="Error">
              {event.errorMessage}
            </Alert>
          ) : null}
        </Paper>

        {showDiff ? (
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            <JsonBlock label="Old value" value={event.oldValue} />
            <JsonBlock label="New value" value={event.newValue} />
          </SimpleGrid>
        ) : event.oldValue || event.newValue ? (
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            <JsonBlock label="Old value" value={event.oldValue} />
            <JsonBlock label="New value" value={event.newValue} />
          </SimpleGrid>
        ) : null}
      </Stack>
    </Box>
  )
}
