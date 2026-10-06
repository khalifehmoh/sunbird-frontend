import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  Alert,
  Badge,
  Box,
  Button,
  Group,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  Text,
} from '@mantine/core'
import { StatusBadge } from '../../../components/StatusBadge/StatusBadge'
import {
  useGetCriticalResultsQuery,
  useGetResultQuery,
  useGetResultsQuery,
} from '../../../redux/features/emr/emrApi'
import { PageHeader } from '../shared/PageHeader'
import { QueryState } from '../shared/QueryState'
import {
  FLAG_COLOR,
  REPORT_STATUS_COLOR,
  formatDateTime,
} from '../shared/format'
import { PatientCell, ResultsTable } from '../shared/tables'

const CRITICAL_POLL_MS = 60_000

/** Page 13: one report with its observations and flags. */
export function ResultViewerPage() {
  const { id = '' } = useParams()
  const { data, isLoading, error } = useGetResultQuery(id)

  return (
    <Box p="md">
      <PageHeader
        title={data?.display ?? 'Result'}
        crumbs={[{ label: 'Results', to: '/emr/results' }, { label: 'Report' }]}
        description={data ? `${data.type ?? 'Report'} · issued ${formatDateTime(data.issuedAt)}` : undefined}
      />
      <QueryState isLoading={isLoading} error={error}>
        {data && (
          <Stack>
            {data.hasCritical && (
              <Alert color="red" title="Critical value">
                This report contains one or more critical results.
              </Alert>
            )}
            <Paper withBorder radius="md" p="md">
              <Group justify="space-between" align="flex-start">
                <Stack gap={2}>
                  <PatientCell id={data.patientId} name={data.patientName} mrn={data.mrn} />
                  <Text size="sm" c="dimmed">
                    Order {data.orderNumber ?? '—'} · Source {data.source}
                  </Text>
                </Stack>
                <StatusBadge value={data.status} colorMap={REPORT_STATUS_COLOR} variant="light" />
              </Group>
            </Paper>
            <Paper withBorder radius="md" p="md">
              <Table.ScrollContainer minWidth={640}>
                <Table verticalSpacing="xs">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Test</Table.Th>
                      <Table.Th>Value</Table.Th>
                      <Table.Th>Reference</Table.Th>
                      <Table.Th>Flag</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Observed</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {data.observations.map((obs) => (
                      <Table.Tr key={obs.id}>
                        <Table.Td>
                          {obs.display ?? obs.code}
                          {obs.corrected && (
                            <Badge ml={6} size="xs" color="violet">
                              Corrected
                            </Badge>
                          )}
                        </Table.Td>
                        <Table.Td fw={600} c={obs.flag === 'critical' ? 'red' : undefined}>
                          {obs.value ?? '—'} {obs.unit ?? ''}
                        </Table.Td>
                        <Table.Td>{obs.referenceRange ?? '—'}</Table.Td>
                        <Table.Td>
                          <StatusBadge value={obs.flag} colorMap={FLAG_COLOR} variant="light" />
                        </Table.Td>
                        <Table.Td>{obs.status}</Table.Td>
                        <Table.Td>{formatDateTime(obs.observedAt)}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
              {data.conclusion && (
                <Text mt="md" size="sm">
                  <Text span fw={600}>
                    Conclusion:{' '}
                  </Text>
                  {data.conclusion}
                </Text>
              )}
            </Paper>
          </Stack>
        )}
      </QueryState>
    </Box>
  )
}

/** Page 14: results list. */
export function ResultListPage() {
  const [params, setParams] = useSearchParams()
  const status = params.get('status')
  const criticalOnly = params.get('critical') === 'true'
  const patientId = params.get('patientId')

  const { data, isLoading, error } = useGetResultsQuery({
    patientId: patientId ?? undefined,
    status: status ?? undefined,
    criticalOnly: criticalOnly || undefined,
    limit: 100,
  })
  const rows = data?.items ?? []

  function setFilter(key: string, value: string | null) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  return (
    <Box p="md">
      <PageHeader
        title="Results"
        description="Laboratory and radiology reports."
        actions={
          <Button component={Link} to="/emr/results/critical" color="red" variant="light">
            Critical results
          </Button>
        }
      />
      <Paper withBorder radius="md" p="md" mb="md">
        <Group>
          <Select
            placeholder="Status"
            clearable
            data={['final', 'preliminary', 'amended', 'corrected', 'registered']}
            value={status}
            onChange={(value) => setFilter('status', value)}
          />
          <Switch
            label="Critical only"
            checked={criticalOnly}
            onChange={(event) => setFilter('critical', event.currentTarget.checked ? 'true' : null)}
          />
          {patientId && (
            <Button variant="subtle" onClick={() => setFilter('patientId', null)}>
              Clear patient filter
            </Button>
          )}
        </Group>
      </Paper>
      <QueryState isLoading={isLoading} error={error} empty={rows.length === 0} emptyMessage="No results match.">
        <ResultsTable rows={rows} />
      </QueryState>
    </Box>
  )
}

/** Page 15: critical results, refreshed every minute. */
export function CriticalResultsPage() {
  const { data, isLoading, error } = useGetCriticalResultsQuery(
    { limit: 100 },
    { pollingInterval: CRITICAL_POLL_MS },
  )
  const rows = data?.items ?? []

  return (
    <Box p="md">
      <PageHeader
        title="Critical results"
        description="Refreshes automatically every minute."
        crumbs={[{ label: 'Results', to: '/emr/results' }, { label: 'Critical' }]}
      />
      <QueryState isLoading={isLoading} error={error} empty={rows.length === 0} emptyMessage="No critical results.">
        <Paper withBorder radius="md" p="md">
          <Table.ScrollContainer minWidth={640}>
            <Table highlightOnHover verticalSpacing="xs">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Patient</Table.Th>
                  <Table.Th>Test</Table.Th>
                  <Table.Th>Value</Table.Th>
                  <Table.Th>Reference</Table.Th>
                  <Table.Th>Observed</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map((alert) => (
                  <Table.Tr key={alert.id}>
                    <Table.Td>
                      <PatientCell id={alert.patientId} name={alert.patientName} mrn={alert.mrn} />
                    </Table.Td>
                    <Table.Td>{alert.display ?? alert.code}</Table.Td>
                    <Table.Td fw={700} c="red">
                      {alert.value ?? '—'} {alert.unit ?? ''}
                    </Table.Td>
                    <Table.Td>{alert.referenceRange ?? '—'}</Table.Td>
                    <Table.Td>{formatDateTime(alert.observedAt)}</Table.Td>
                    <Table.Td>
                      {alert.reportId && (
                        <Text component={Link} to={`/emr/results/${alert.reportId}`} size="sm" c="blue">
                          Open report
                        </Text>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>
      </QueryState>
    </Box>
  )
}
