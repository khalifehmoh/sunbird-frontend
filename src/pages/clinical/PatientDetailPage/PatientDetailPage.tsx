import { useNavigate, useParams } from 'react-router-dom'
import {
  Anchor,
  Box,
  Breadcrumbs,
  Grid,
  Group,
  Loader,
  Paper,
  Tabs,
  Text,
  Title,
} from '@mantine/core'
import { Activity, FileJson, Pencil } from 'lucide-react'
import type { Patient, Resource } from '@medplum/fhirtypes'
import {
  PatientSummary,
  ResourceForm,
  ResourceTable,
  useMedplum,
  useResource,
} from '@medplum/react'
import { ClinicalAccess } from '../../../constants/permissions'
import { useHasPermissions } from '../../../hooks/usePermissions'
import { notify } from '../../../lib/notify'

/**
 * Patient record assembled from `@medplum/react` components.
 *
 * The three tabs are the point of the spike: a clinical summary, the raw FHIR
 * resource, and an editable form — none of which required writing field-level
 * UI, because the components read the `Patient` StructureDefinition from the
 * server to decide what to render.
 */
export function PatientDetailPage() {
  const { id } = useParams()
  const medplum = useMedplum()
  const navigate = useNavigate()
  const canUpdate = useHasPermissions(ClinicalAccess.update)
  const patient = useResource<Patient>({ reference: `Patient/${id}` })

  async function handleSave(resource: Resource) {
    try {
      await medplum.updateResource(resource as Patient)
      notify({
        type: 'success',
        title: 'Patient updated',
        message: 'Changes were written to the clinical record.',
      })
    } catch (error) {
      notify({
        type: 'error',
        title: 'Could not save patient',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  if (!patient) {
    return (
      <Group justify="center" p="xl">
        <Loader />
      </Group>
    )
  }

  const primaryName = patient.name?.[0]
  const arabicName = patient.name?.[1]

  return (
    <Box p="xl">
      <Breadcrumbs mb="sm">
        <Anchor onClick={() => void navigate('/clinical/patients')} size="sm">
          Patients
        </Anchor>
        <Text size="sm">{primaryName?.text ?? patient.id}</Text>
      </Breadcrumbs>

      <Group justify="space-between" align="flex-start" mb="md">
        <div>
          <Title order={1} mb={4}>
            {primaryName?.text ??
              `${primaryName?.given?.join(' ') ?? ''} ${primaryName?.family ?? ''}`}
          </Title>
          {/* The Arabic name is a second FHIR `name` element, not a separate
              column, so it renders right-to-left on its own. */}
          {arabicName?.text && (
            <Text dir="rtl" c="dimmed" size="sm">
              {arabicName.text}
            </Text>
          )}
        </div>
        <Text c="dimmed" size="xs" ff="monospace">
          Patient/{patient.id}
        </Text>
      </Group>

      <Grid gutter="md">
        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Paper withBorder radius="md" p="md">
            <PatientSummary patient={patient} />
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Paper withBorder radius="md" p="md">
            <Tabs defaultValue="resource">
              <Tabs.List mb="md">
                <Tabs.Tab
                  value="resource"
                  leftSection={<Activity size={14} />}
                >
                  Record
                </Tabs.Tab>
                {canUpdate && (
                  <Tabs.Tab value="edit" leftSection={<Pencil size={14} />}>
                    Edit
                  </Tabs.Tab>
                )}
                <Tabs.Tab value="json" leftSection={<FileJson size={14} />}>
                  FHIR JSON
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="resource">
                <ResourceTable value={patient} ignoreMissingValues />
              </Tabs.Panel>

              {canUpdate && (
                <Tabs.Panel value="edit">
                  <ResourceForm
                    defaultValue={patient}
                    onSubmit={(resource) => void handleSave(resource)}
                  />
                </Tabs.Panel>
              )}

              <Tabs.Panel value="json">
                <Text
                  component="pre"
                  size="xs"
                  ff="monospace"
                  style={{ whiteSpace: 'pre-wrap', margin: 0 }}
                >
                  {JSON.stringify(patient, null, 2)}
                </Text>
              </Tabs.Panel>
            </Tabs>
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  )
}
