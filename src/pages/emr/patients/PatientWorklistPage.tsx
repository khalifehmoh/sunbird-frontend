import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Badge,
  Box,
  Button,
  Grid,
  Group,
  Paper,
  ScrollArea,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { AlertTriangle, Search, UserPlus } from 'lucide-react'
import { EmrAccess } from '../../../constants/permissions'
import { useHasPermissions } from '../../../hooks/usePermissions'
import {
  useGetPatientOverviewQuery,
  useGetWorklistQuery,
  type WorklistFilter,
  type WorklistItem,
} from '../../../redux/features/emr/emrApi'
import { PageHeader } from '../shared/PageHeader'
import { QueryState } from '../shared/QueryState'
import {
  PATIENT_CLASS_COLOR,
  PATIENT_CLASS_LABEL,
  formatDateTime,
  genderLabel,
} from '../shared/format'
import { PatientActions } from './PatientActions'
import { PatientOverviewPanel } from './PatientOverviewPanel'

const FILTERS: { value: WorklistFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'inpatient', label: 'Inpatients' },
  { value: 'opd', label: 'OPD' },
  { value: 'ed', label: 'ED' },
  { value: 'critical', label: 'Critical' },
]

function isFilter(value: string | null): value is WorklistFilter {
  return FILTERS.some((filter) => filter.value === value)
}

function WorklistRow({
  patient,
  selected,
  onSelect,
}: {
  patient: WorklistItem
  selected: boolean
  onSelect: () => void
}) {
  return (
    <UnstyledButton
      onClick={onSelect}
      w="100%"
      p="sm"
      style={{
        borderBottom: '1px solid var(--mantine-color-default-border)',
        background: selected ? 'var(--mantine-color-blue-light)' : undefined,
      }}
    >
      <Group justify="space-between" wrap="nowrap" align="flex-start">
        <Stack gap={0}>
          <Group gap={6} wrap="nowrap">
            <Text fw={600} size="sm">
              {patient.name}
            </Text>
            {patient.critical && (
              <AlertTriangle size={14} color="var(--mantine-color-red-6)" />
            )}
            {patient.hasAllergy && (
              <Badge size="xs" color="red" variant="light">
                Allergy
              </Badge>
            )}
          </Group>
          <Text size="xs" c="dimmed">
            {patient.mrn ?? 'No MRN'} · {genderLabel(patient.gender)}
            {patient.ageYears !== null ? ` · ${patient.ageYears} y` : ''}
          </Text>
          <Text size="xs" c="dimmed">
            {patient.ward ?? patient.location ?? 'No active visit'}
          </Text>
        </Stack>
        <Stack gap={2} align="flex-end">
          {patient.patientClass && (
            <Badge
              size="sm"
              variant="light"
              color={PATIENT_CLASS_COLOR[patient.patientClass] ?? 'gray'}
            >
              {PATIENT_CLASS_LABEL[patient.patientClass] ?? patient.patientClass}
            </Badge>
          )}
          <Text size="xs" c="dimmed">
            {formatDateTime(patient.lastActivity)}
          </Text>
        </Stack>
      </Group>
    </UnstyledButton>
  )
}

function DetailPane({ patient }: { patient: WorklistItem }) {
  const { data, isLoading, error } = useGetPatientOverviewQuery(patient.id)

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <Stack gap={0}>
          <Text fw={700} size="xl">
            {patient.name}
          </Text>
          {patient.nameAr && (
            <Text size="sm" c="dimmed" dir="rtl">
              {patient.nameAr}
            </Text>
          )}
        </Stack>
        <PatientActions
          patientId={patient.id}
          encounterId={patient.encounterId}
          patientClass={patient.patientClass}
        />
      </Group>
      <QueryState isLoading={isLoading} error={error}>
        {data && <PatientOverviewPanel overview={data} />}
      </QueryState>
    </Stack>
  )
}

export function PatientWorklistPage() {
  const [params, setParams] = useSearchParams()
  const filterParam = params.get('filter')
  const filter: WorklistFilter = isFilter(filterParam) ? filterParam : 'all'
  const selectedId = params.get('selected')
  const [search, setSearch] = useState(params.get('q') ?? '')
  const [debounced] = useDebouncedValue(search.trim(), 300)
  const canRegister = useHasPermissions(EmrAccess.create)

  const { data, isLoading, isFetching, error } = useGetWorklistQuery({
    q: debounced || undefined,
    filter,
    limit: 50,
  })

  function update(next: Record<string, string | null>) {
    const merged = new URLSearchParams(params)
    for (const [key, value] of Object.entries(next)) {
      if (value) merged.set(key, value)
      else merged.delete(key)
    }
    setParams(merged, { replace: true })
  }

  const items = data?.items ?? []
  const selected = items.find((patient) => patient.id === selectedId) ?? null

  return (
    <Box p="md">
      <PageHeader
        title="Patients"
        description="Worklist of registered patients and their active visits."
        actions={
          canRegister && (
            <Button
              component={Link}
              to="/emr/patients/new"
              leftSection={<UserPlus size={16} />}
            >
              Register patient
            </Button>
          )
        }
      />
      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 5, lg: 4 }}>
          <Paper withBorder radius="md">
            <Stack gap="xs" p="sm">
              <TextInput
                placeholder="Name, MRN or mobile"
                leftSection={<Search size={16} />}
                value={search}
                onChange={(event) => {
                  const value = event.currentTarget.value
                  setSearch(value)
                  update({ q: value.trim() || null })
                }}
              />
              <SegmentedControl
                size="xs"
                fullWidth
                value={filter}
                onChange={(value) =>
                  update({ filter: value === 'all' ? null : value })
                }
                data={FILTERS.map((entry) => ({
                  value: entry.value,
                  label: `${entry.label}${data ? ` ${data.counts[entry.value]}` : ''}`,
                }))}
              />
            </Stack>
            <ScrollArea h="calc(100vh - 290px)" type="auto">
              <QueryState
                isLoading={isLoading}
                error={error}
                empty={items.length === 0}
                emptyMessage={
                  isFetching ? 'Searching…' : 'No patients match this view.'
                }
              >
                {items.map((patient) => (
                  <WorklistRow
                    key={patient.id}
                    patient={patient}
                    selected={patient.id === selectedId}
                    onSelect={() => update({ selected: patient.id })}
                  />
                ))}
              </QueryState>
            </ScrollArea>
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 7, lg: 8 }}>
          <Paper withBorder radius="md" p="md" mih={300}>
            {selected ? (
              <DetailPane patient={selected} />
            ) : (
              <Text c="dimmed" ta="center" mt="xl">
                Select a patient to see their summary.
              </Text>
            )}
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  )
}
