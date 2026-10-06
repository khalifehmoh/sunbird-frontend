import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Alert,
  Badge,
  Box,
  Button,
  Code,
  Group,
  Modal,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
  Timeline,
  Title,
} from '@mantine/core'
import { StatusBadge } from '../../../components/StatusBadge/StatusBadge'
import { StatCard } from '../../../components/StatCard/StatCard'
import { EmrAccess } from '../../../constants/permissions'
import { useHasPermissions } from '../../../hooks/usePermissions'
import { notify } from '../../../lib/notify'
import {
  useGetIntegrationDashboardQuery,
  useGetIntegrationMessageQuery,
  useGetIntegrationMessagesQuery,
  useRetryIntegrationMessageMutation,
  useSubmitIntegrationMessageMutation,
  type IngestOutcome,
  type MessageStatus,
} from '../../../redux/features/emr/emrApi'
import { PageHeader } from '../shared/PageHeader'
import { QueryState } from '../shared/QueryState'
import { MESSAGE_STATUS_COLOR, errorMessage, formatDateTime } from '../shared/format'

const POLL_MS = 30_000
const MESSAGE_TYPES = ['ORU^R01', 'ORM^O01', 'SIU^S12', 'SIU^S14', 'SIU^S15']

function OutcomeAlert({ outcome }: { outcome: IngestOutcome }) {
  return (
    <Alert color={outcome.status === 'PROCESSED' ? 'teal' : 'red'} title={`ACK ${outcome.ackCode}`}>
      <Text size="sm">{outcome.detail}</Text>
      <Code block mt="xs">
        {outcome.ack.replace(/\r/g, '\n')}
      </Code>
    </Alert>
  )
}

/** Page 22: message list with today's KPIs. */
export function IntegrationMonitorPage() {
  const [params, setParams] = useSearchParams()
  const status = (params.get('status') as MessageStatus | null) ?? undefined
  const messageType = params.get('type') ?? undefined
  const q = params.get('q') ?? ''
  const canManage = useHasPermissions(EmrAccess.integrationManage)
  const [submitOpen, setSubmitOpen] = useState(false)
  const [raw, setRaw] = useState('')
  const [outcome, setOutcome] = useState<IngestOutcome | null>(null)
  const [submit, { isLoading: submitting }] = useSubmitIntegrationMessageMutation()

  const { data: stats } = useGetIntegrationDashboardQuery(undefined, { pollingInterval: POLL_MS })
  const { data, isLoading, error } = useGetIntegrationMessagesQuery(
    { status, messageType, q: q || undefined, limit: 100 },
    { pollingInterval: POLL_MS },
  )
  const rows = data?.items ?? []

  function setFilter(key: string, value: string | null) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  async function send() {
    try {
      setOutcome(await submit(raw.replace(/\r?\n/g, '\r')).unwrap())
    } catch (err) {
      notify({ type: 'error', title: 'Submit failed', message: errorMessage(err) })
    }
  }

  return (
    <Box p="md">
      <PageHeader
        title="Integration monitor"
        description="Inbound HL7 v2 messages. Refreshes every 30 seconds."
        actions={
          canManage && (
            <Button variant="light" onClick={() => { setOutcome(null); setSubmitOpen(true) }}>
              Submit test message
            </Button>
          )
        }
      />
      <SimpleGrid cols={{ base: 2, md: 4 }} mb="md">
        <StatCard label="Received today" value={stats?.received} icon={null} color="blue" />
        <StatCard label="Processed" value={stats?.processed} icon={null} color="teal" />
        <StatCard label="Failed" value={stats?.failed} icon={null} color="red" />
        <Paper withBorder radius="md" p="lg">
          <Text size="xs" tt="uppercase" fw={700} c="dimmed" lts={1}>
            Failure rate
          </Text>
          <Title order={2}>{stats?.failureRatePercent ?? 0}%</Title>
        </Paper>
      </SimpleGrid>
      <Paper withBorder radius="md" p="md" mb="md">
        <Group>
          <Select
            placeholder="Status"
            clearable
            data={['RECEIVED', 'PROCESSED', 'FAILED']}
            value={status ?? null}
            onChange={(value) => setFilter('status', value)}
          />
          <Select
            placeholder="Message type"
            clearable
            data={MESSAGE_TYPES}
            value={messageType ?? null}
            onChange={(value) => setFilter('type', value)}
          />
          <TextInput
            placeholder="Control id or text"
            value={q}
            onChange={(event) => setFilter('q', event.currentTarget.value || null)}
          />
        </Group>
      </Paper>
      <QueryState isLoading={isLoading} error={error} empty={rows.length === 0} emptyMessage="No messages match.">
        <Paper withBorder radius="md" p="md">
          <Table.ScrollContainer minWidth={760}>
            <Table highlightOnHover verticalSpacing="xs">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Received</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Control id</Table.Th>
                  <Table.Th>Source</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Attempts</Table.Th>
                  <Table.Th>Error</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map((row) => (
                  <Table.Tr key={row.id}>
                    <Table.Td>{formatDateTime(row.receivedAt)}</Table.Td>
                    <Table.Td>{row.messageType ?? '—'}</Table.Td>
                    <Table.Td>
                      <Text component={Link} to={`/emr/integration/transaction/${row.id}`} size="sm" c="blue">
                        {row.controlId ?? row.id.slice(0, 8)}
                      </Text>
                    </Table.Td>
                    <Table.Td>{row.sendingApplication ?? row.source}</Table.Td>
                    <Table.Td>
                      <StatusBadge value={row.status} colorMap={MESSAGE_STATUS_COLOR} variant="light" />
                    </Table.Td>
                    <Table.Td>{row.attempts}</Table.Td>
                    <Table.Td>
                      {row.lastError ? (
                        <Text size="xs" c="red" lineClamp={1}>
                          {row.lastError.code}: {row.lastError.message}
                        </Text>
                      ) : (
                        '—'
                      )}
                    </Table.Td>
                    <Table.Td>
                      {canManage && row.status === 'FAILED' && (
                        <Button
                          component={Link}
                          to={`/emr/integration/retry/${row.id}`}
                          size="compact-xs"
                          variant="light"
                        >
                          Retry
                        </Button>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>
      </QueryState>

      <Modal opened={submitOpen} onClose={() => setSubmitOpen(false)} title="Submit an HL7 v2 message" size="lg">
        <Stack>
          <Textarea
            label="Message"
            description="Paste a pipe-delimited HL7 v2 message (MSH first)."
            minRows={8}
            autosize
            styles={{ input: { fontFamily: 'monospace' } }}
            value={raw}
            onChange={(event) => setRaw(event.currentTarget.value)}
          />
          {outcome && <OutcomeAlert outcome={outcome} />}
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setSubmitOpen(false)}>
              Close
            </Button>
            <Button loading={submitting} disabled={!raw.trim()} onClick={() => void send()}>
              Submit
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  )
}

/** Page 23: everything recorded for one message. */
export function IntegrationTransactionPage() {
  const { id = '' } = useParams()
  const canManage = useHasPermissions(EmrAccess.integrationManage)
  const { data, isLoading, error } = useGetIntegrationMessageQuery(id)

  return (
    <Box p="md">
      <PageHeader
        title={data?.controlId ? `Message ${data.controlId}` : 'Message'}
        crumbs={[{ label: 'Integration', to: '/emr/integration' }, { label: 'Transaction' }]}
        actions={
          canManage && data?.status === 'FAILED' && (
            <Button component={Link} to={`/emr/integration/retry/${id}`}>
              Retry
            </Button>
          )
        }
      />
      <QueryState isLoading={isLoading} error={error}>
        {data && (
          <Stack>
            <Paper withBorder radius="md" p="md">
              <SimpleGrid cols={{ base: 2, md: 4 }}>
                <div>
                  <Text size="xs" c="dimmed">Type</Text>
                  <Text>{data.messageType ?? '—'}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">Status</Text>
                  <StatusBadge value={data.status} colorMap={MESSAGE_STATUS_COLOR} variant="light" />
                </div>
                <div>
                  <Text size="xs" c="dimmed">Received</Text>
                  <Text>{formatDateTime(data.receivedAt)}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">Attempts</Text>
                  <Text>{data.attempts}</Text>
                </div>
              </SimpleGrid>
            </Paper>

            <Paper withBorder radius="md" p="md">
              <Title order={4} mb="sm">Processing stages</Title>
              <Timeline bulletSize={18} active={data.stages.length}>
                {data.stages.map((stage) => (
                  <Timeline.Item
                    key={stage.seq}
                    title={`${stage.stage} — ${stage.status}`}
                    color={stage.status === 'OK' ? 'teal' : 'red'}
                  >
                    {stage.detail && <Text size="sm" c="dimmed">{stage.detail}</Text>}
                    <Text size="xs" c="dimmed">{formatDateTime(stage.at)}</Text>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Paper>

            {data.errors.length > 0 && (
              <Paper withBorder radius="md" p="md">
                <Title order={4} mb="sm">Errors</Title>
                <Stack gap="xs">
                  {data.errors.map((entry, index) => (
                    <Alert key={`${entry.at}-${index}`} color="red" title={`${entry.stage}: ${entry.code}`}>
                      {entry.message}
                      <Text size="xs" c="dimmed">{formatDateTime(entry.at)}</Text>
                    </Alert>
                  ))}
                </Stack>
              </Paper>
            )}

            <Paper withBorder radius="md" p="md">
              <Title order={4} mb="sm">Raw message</Title>
              <Code block>{data.rawMessage.replace(/\r/g, '\n')}</Code>
            </Paper>

            {data.acks.length > 0 && (
              <Paper withBorder radius="md" p="md">
                <Title order={4} mb="sm">Acknowledgements</Title>
                <Stack gap="xs">
                  {data.acks.map((ack, index) => (
                    <div key={`${ack.at}-${index}`}>
                      <Group gap="xs">
                        <Badge color={ack.code === 'AA' ? 'teal' : 'red'}>{ack.code}</Badge>
                        <Text size="xs" c="dimmed">{formatDateTime(ack.at)}</Text>
                      </Group>
                      <Code block>{ack.raw.replace(/\r/g, '\n')}</Code>
                    </div>
                  ))}
                </Stack>
              </Paper>
            )}

            {data.retries.length > 0 && (
              <Paper withBorder radius="md" p="md">
                <Title order={4} mb="sm">Retries</Title>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>When</Table.Th>
                      <Table.Th>Requested by</Table.Th>
                      <Table.Th>Reason</Table.Th>
                      <Table.Th>Outcome</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {data.retries.map((retry, index) => (
                      <Table.Tr key={`${retry.at}-${index}`}>
                        <Table.Td>{formatDateTime(retry.at)}</Table.Td>
                        <Table.Td>{retry.requestedBy ?? '—'}</Table.Td>
                        <Table.Td>{retry.reason ?? '—'}</Table.Td>
                        <Table.Td>{retry.outcome ?? '—'}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            )}
          </Stack>
        )}
      </QueryState>
    </Box>
  )
}

/** Page 24: confirm and run a retry. */
export function IntegrationRetryPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, error } = useGetIntegrationMessageQuery(id)
  const [retry, { isLoading: retrying }] = useRetryIntegrationMessageMutation()
  const [outcome, setOutcome] = useState<IngestOutcome | null>(null)

  async function run() {
    try {
      setOutcome(await retry(id).unwrap())
    } catch (err) {
      notify({ type: 'error', title: 'Retry failed', message: errorMessage(err) })
    }
  }

  const lastError = data?.errors[data.errors.length - 1] ?? data?.errors[0]

  return (
    <Box p="md">
      <PageHeader
        title="Retry message"
        crumbs={[
          { label: 'Integration', to: '/emr/integration' },
          { label: 'Transaction', to: `/emr/integration/transaction/${id}` },
          { label: 'Retry' },
        ]}
      />
      <QueryState isLoading={isLoading} error={error}>
        {data && (
          <Paper withBorder radius="md" p="lg" maw={720}>
            <Stack>
              <Group justify="space-between">
                <Text fw={600}>
                  {data.messageType ?? 'Message'} · {data.controlId ?? data.id}
                </Text>
                <StatusBadge value={data.status} colorMap={MESSAGE_STATUS_COLOR} variant="light" />
              </Group>
              {lastError && (
                <Alert color="red" title={`${lastError.stage}: ${lastError.code}`}>
                  {lastError.message}
                </Alert>
              )}
              {data.status !== 'FAILED' && !outcome && (
                <Alert color="gray">Only a failed message can be retried.</Alert>
              )}
              <Text size="sm" c="dimmed">
                Retrying re-runs the stored message through the same pipeline. Messages are
                idempotent, so a message that already took effect will not create duplicates.
              </Text>
              {outcome && <OutcomeAlert outcome={outcome} />}
              <Group justify="flex-end">
                <Button variant="default" onClick={() => void navigate(`/emr/integration/transaction/${id}`)}>
                  {outcome ? 'Back to transaction' : 'Cancel'}
                </Button>
                {!outcome && (
                  <Button loading={retrying} disabled={data.status !== 'FAILED'} onClick={() => void run()}>
                    Retry now
                  </Button>
                )}
              </Group>
            </Stack>
          </Paper>
        )}
      </QueryState>
    </Box>
  )
}
