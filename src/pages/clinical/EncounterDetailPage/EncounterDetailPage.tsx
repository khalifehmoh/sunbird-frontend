import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Anchor,
  Box,
  Breadcrumbs,
  Button,
  Grid,
  Group,
  Loader,
  Paper,
  Tabs,
  Text,
  Title,
} from '@mantine/core'
import {
  Activity,
  ArrowLeftRight,
  DoorOpen,
  FileJson,
  History,
} from 'lucide-react'
import type { Encounter } from '@medplum/fhirtypes'
import {
  EncounterTimeline,
  PatientSummary,
  ResourceTable,
  useResource,
} from '@medplum/react'
import { useGetAdtEncounterQuery } from '../../../redux/features/adt/adtApi'
import { DischargeNotificationsPanel } from '../adt/DischargeNotificationsPanel'

export function EncounterDetailPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const encounter = useResource<Encounter>({ reference: `Encounter/${id}` })
  const { data: summary } = useGetAdtEncounterQuery(id ?? '', {
    skip: !id,
  })
  const watchEvents = searchParams.get('watchEvents') === '1'

  if (!encounter) {
    return (
      <Group justify="center" p="xl">
        <Loader />
      </Group>
    )
  }

  const patientId = encounter.subject?.reference?.replace(/^Patient\//, '')
  const isFinished =
    encounter.status === 'finished' ||
    summary?.status === 'finished' ||
    summary?.lastAdtEvent === 'A03'
  const isActiveInpatient =
    encounter.class?.code === 'IMP' &&
    encounter.status === 'in-progress' &&
    summary?.status !== 'finished' &&
    summary?.lastAdtEvent !== 'A03'

  return (
    <Box p="xl">
      <Breadcrumbs mb="sm">
        <Anchor onClick={() => void navigate('/clinical/encounters')} size="sm">
          Encounters
        </Anchor>
        <Text size="sm">{summary?.visitNumber ?? encounter.id}</Text>
      </Breadcrumbs>

      <Group justify="space-between" align="flex-start" mb="md">
        <div>
          <Title order={1} mb={4}>
            {summary?.visitNumber ?? `Encounter/${encounter.id}`}
          </Title>
          <Text c="dimmed" size="sm">
            {encounter.class?.display ?? encounter.class?.code} ·{' '}
            {summary?.status ?? encounter.status}
            {summary?.lastAdtEvent ? ` · last ADT ${summary.lastAdtEvent}` : ''}
            {summary?.locationDisplay ? ` · ${summary.locationDisplay}` : ''}
          </Text>
        </div>
        <Group>
          {isActiveInpatient && patientId && (
            <>
              <Button
                variant="light"
                leftSection={<ArrowLeftRight size={16} />}
                onClick={() =>
                  void navigate(
                    `/clinical/adt/transfer?patient=${patientId}&encounter=${encounter.id}`,
                  )
                }
              >
                Transfer
              </Button>
              <Button
                color="red"
                variant="light"
                leftSection={<DoorOpen size={16} />}
                onClick={() =>
                  void navigate(
                    `/clinical/adt/discharge?patient=${patientId}&encounter=${encounter.id}`,
                  )
                }
              >
                Discharge
              </Button>
            </>
          )}
        </Group>
      </Group>

      <Grid gutter="md">
        <Grid.Col span={{ base: 12, lg: 4 }}>
          {patientId ? (
            <Paper withBorder radius="md" p="md">
              <PatientSummary patient={{ reference: `Patient/${patientId}` }} />
            </Paper>
          ) : (
            <Paper withBorder radius="md" p="md">
              <Text c="dimmed">No patient linked</Text>
            </Paper>
          )}
        </Grid.Col>
        <Grid.Col span={{ base: 12, lg: 8 }}>
          {(isFinished || watchEvents) && id && (
            <DischargeNotificationsPanel
              encounterId={id}
              watch={watchEvents}
            />
          )}
          <Paper withBorder radius="md" p="md">
            <Tabs defaultValue="record">
              <Tabs.List mb="md">
                <Tabs.Tab value="record" leftSection={<Activity size={14} />}>
                  Record
                </Tabs.Tab>
                <Tabs.Tab value="timeline" leftSection={<History size={14} />}>
                  Timeline
                </Tabs.Tab>
                <Tabs.Tab value="json" leftSection={<FileJson size={14} />}>
                  FHIR JSON
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="record">
                <ResourceTable value={encounter} ignoreMissingValues />
              </Tabs.Panel>

              <Tabs.Panel value="timeline">
                <EncounterTimeline encounter={encounter} />
              </Tabs.Panel>

              <Tabs.Panel value="json">
                <Text
                  component="pre"
                  size="xs"
                  ff="monospace"
                  style={{ whiteSpace: 'pre-wrap', margin: 0 }}
                >
                  {JSON.stringify(encounter, null, 2)}
                </Text>
              </Tabs.Panel>
            </Tabs>
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  )
}
