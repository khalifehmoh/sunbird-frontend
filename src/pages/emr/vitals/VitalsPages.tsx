import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Badge,
  Box,
  Button,
  Group,
  NumberInput,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  Textarea,
} from '@mantine/core'
import { LineChart } from '@mantine/charts'
import { Plus } from 'lucide-react'
import { EmrAccess } from '../../../constants/permissions'
import { useHasPermissions } from '../../../hooks/usePermissions'
import { notify } from '../../../lib/notify'
import {
  useGetVitalDefinitionsQuery,
  useGetVitalsQuery,
  useRecordVitalsMutation,
  type VitalDefinition,
} from '../../../redux/features/emr/emrApi'
import { PageHeader } from '../shared/PageHeader'
import { PatientPicker } from '../shared/PatientPicker'
import { QueryState } from '../shared/QueryState'
import { errorMessage, formatDateTime } from '../shared/format'
import { VitalsTable } from '../shared/tables'

type Range = { low?: number; high?: number } | null

function outside(value: number, range: Range): boolean {
  if (!range) return false
  return (
    (range.low !== undefined && value < range.low) ||
    (range.high !== undefined && value > range.high)
  )
}

function describe(range: Range): string {
  if (!range) return ''
  if (range.low !== undefined && range.high !== undefined) return `${range.low}–${range.high}`
  if (range.low !== undefined) return `≥ ${range.low}`
  if (range.high !== undefined) return `≤ ${range.high}`
  return ''
}

function ReadingInput({
  definition,
  value,
  onChange,
}: {
  definition: VitalDefinition
  value: number | ''
  onChange: (value: number | '') => void
}) {
  const numeric = typeof value === 'number' ? value : null
  const { plausible } = definition
  const implausible =
    numeric !== null && (numeric < plausible.low || numeric > plausible.high)
  const critical = numeric !== null && !implausible && outside(numeric, definition.critical)
  const abnormal = numeric !== null && !implausible && !critical && outside(numeric, definition.normal)

  return (
    <NumberInput
      label={`${definition.display} (${definition.unit})`}
      description={
        definition.normal ? `Normal ${describe(definition.normal)}` : undefined
      }
      value={value}
      onChange={(next) => onChange(typeof next === 'number' ? next : '')}
      decimalScale={1}
      hideControls
      error={
        implausible
          ? `Outside the plausible range ${plausible.low}–${plausible.high}`
          : critical
            ? 'Critical value'
            : undefined
      }
      styles={
        abnormal
          ? { input: { borderColor: 'var(--mantine-color-orange-6)' } }
          : undefined
      }
    />
  )
}

/** Page 19: record a set of readings. */
export function VitalsEntryPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [patientId, setPatientId] = useState<string | null>(params.get('patientId'))
  const [values, setValues] = useState<Record<string, number | ''>>({})
  const [note, setNote] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const { data: definitions, isLoading, error } = useGetVitalDefinitionsQuery()
  const [record, { isLoading: saving }] = useRecordVitalsMutation()

  const readings = Object.entries(values).flatMap(([code, value]) =>
    typeof value === 'number' ? [{ code, value }] : [],
  )
  const implausible = (definitions ?? []).some((definition) => {
    const value = values[definition.key]
    return (
      typeof value === 'number' &&
      (value < definition.plausible.low || value > definition.plausible.high)
    )
  })

  async function submit() {
    setSubmitted(true)
    if (!patientId || readings.length === 0 || implausible) return
    try {
      await record({
        patientId,
        readings,
        note: note.trim() || undefined,
        source: 'MANUAL',
      }).unwrap()
      notify({
        type: 'success',
        title: 'Vitals recorded',
        message: `${readings.length} reading(s) saved.`,
      })
      void navigate(`/emr/vitals?patientId=${patientId}`)
    } catch (err) {
      notify({ type: 'error', title: 'Could not save vitals', message: errorMessage(err) })
    }
  }

  return (
    <Box p="md">
      <PageHeader
        title="Record vitals"
        description="Enter the readings taken; leave the rest blank."
        crumbs={[{ label: 'Vitals', to: '/emr/vitals' }, { label: 'Record' }]}
      />
      <Paper withBorder radius="md" p="lg" maw={820}>
        <Stack>
          <PatientPicker
            required
            value={patientId}
            onChange={(id) => setPatientId(id)}
            error={submitted && !patientId ? 'Select a patient' : undefined}
          />
          <QueryState isLoading={isLoading} error={error}>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
              {(definitions ?? []).map((definition) => (
                <ReadingInput
                  key={definition.key}
                  definition={definition}
                  value={values[definition.key] ?? ''}
                  onChange={(next) => setValues((prev) => ({ ...prev, [definition.key]: next }))}
                />
              ))}
            </SimpleGrid>
          </QueryState>
          {submitted && readings.length === 0 && (
            <Text size="sm" c="red">
              Enter at least one reading.
            </Text>
          )}
          <Textarea
            label="Note"
            minRows={2}
            value={note}
            onChange={(event) => setNote(event.currentTarget.value)}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => void navigate(-1)}>
              Cancel
            </Button>
            <Button loading={saving} disabled={implausible} onClick={() => void submit()}>
              Save vitals
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Box>
  )
}

/** Page 20: recorded vitals with a trend chart for one vital. */
export function VitalsDisplayPage() {
  const [params, setParams] = useSearchParams()
  const patientId = params.get('patientId')
  const criticalOnly = params.get('critical') === 'true'
  const [chartKey, setChartKey] = useState<string | null>(null)
  const canCreate = useHasPermissions(EmrAccess.create)

  const { data, isLoading, error } = useGetVitalsQuery({
    patientId: patientId ?? undefined,
    criticalOnly: criticalOnly || undefined,
    limit: 200,
  })
  const rows = useMemo(() => data?.items ?? [], [data])

  const kinds = useMemo(
    () => [...new Map(rows.map((row) => [row.code, row.display])).entries()],
    [rows],
  )
  const activeKey = chartKey ?? kinds[0]?.[0] ?? null
  const series = useMemo(
    () =>
      rows
        .filter((row) => row.code === activeKey && row.measuredAt)
        .sort((a, b) => new Date(a.measuredAt ?? 0).getTime() - new Date(b.measuredAt ?? 0).getTime())
        .map((row) => ({ at: formatDateTime(row.measuredAt), value: row.value })),
    [rows, activeKey],
  )

  function setFilter(key: string, value: string | null) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  return (
    <Box p="md">
      <PageHeader
        title="Vital signs"
        actions={
          canCreate && (
            <Button
              component={Link}
              to={`/emr/vitals/new${patientId ? `?patientId=${patientId}` : ''}`}
              leftSection={<Plus size={16} />}
            >
              Record vitals
            </Button>
          )
        }
      />
      <Paper withBorder radius="md" p="md" mb="md">
        <Group align="flex-end">
          <Box miw={280}>
            <PatientPicker
              value={patientId}
              onChange={(id) => setFilter('patientId', id)}
            />
          </Box>
          <Switch
            label="Critical only"
            checked={criticalOnly}
            onChange={(event) => setFilter('critical', event.currentTarget.checked ? 'true' : null)}
          />
          {data && (
            <Group gap="xs">
              <Badge variant="light">{data.summary.total} readings</Badge>
              <Badge color="orange" variant="light">
                {data.summary.abnormal} abnormal
              </Badge>
              <Badge color="red" variant="light">
                {data.summary.critical} critical
              </Badge>
            </Group>
          )}
        </Group>
      </Paper>
      <QueryState isLoading={isLoading} error={error} empty={rows.length === 0} emptyMessage="No vitals recorded.">
        <Stack>
          {patientId && series.length > 1 && (
            <Paper withBorder radius="md" p="md">
              <Group justify="space-between" mb="sm">
                <Text fw={600}>Trend</Text>
                <Select
                  size="xs"
                  allowDeselect={false}
                  data={kinds.map(([value, label]) => ({ value, label }))}
                  value={activeKey}
                  onChange={setChartKey}
                />
              </Group>
              <LineChart
                h={240}
                data={series}
                dataKey="at"
                series={[{ name: 'value', color: 'blue.6' }]}
                curveType="linear"
              />
            </Paper>
          )}
          <Paper withBorder radius="md" p="md">
            <VitalsTable rows={rows} />
          </Paper>
        </Stack>
      </QueryState>
    </Box>
  )
}
