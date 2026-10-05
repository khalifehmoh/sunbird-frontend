import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Group,
  Modal,
  Paper,
  Text,
  Title,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Info, UserPlus } from 'lucide-react'
import type { SearchRequest } from '@medplum/core'
import type { Patient, Resource } from '@medplum/fhirtypes'
import { ResourceForm, SearchControl, useMedplum } from '@medplum/react'
import { notify } from '../../../lib/notify'

/**
 * Patient search rendered entirely by `@medplum/react`.
 *
 * `SearchControl` builds the columns, filters, sorting, and paging from the
 * FHIR search parameters it reads off the server, so the field list below is
 * the only configuration this screen needs. `total: 'accurate'` is required for
 * the result count — FHIR omits `Bundle.total` unless asked.
 */
const PATIENT_SEARCH: SearchRequest = {
  resourceType: 'Patient',
  fields: ['name', 'identifier', 'gender', 'birthDate', '_lastUpdated'],
  sortRules: [{ code: '_lastUpdated', descending: true }],
  count: 10,
  total: 'accurate',
}

export function PatientListPage() {
  const medplum = useMedplum()
  const navigate = useNavigate()
  const [search, setSearch] = useState<SearchRequest>(PATIENT_SEARCH)
  const [createOpen, createHandlers] = useDisclosure(false)

  async function handleCreate(resource: Resource) {
    try {
      const created = await medplum.createResource(resource as Patient)
      createHandlers.close()
      notify({
        type: 'success',
        title: 'Patient created',
        message: `FHIR Patient/${created.id} was stored.`,
      })
      void navigate(`/clinical/patients/${created.id}`)
    } catch (error) {
      notify({
        type: 'error',
        title: 'Could not create patient',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return (
    <Box p="xl">
      <Group justify="space-between" align="flex-start" mb="md">
        <div>
          <Title order={1} mb={4}>
            Patients
          </Title>
          <Text c="dimmed" size="sm">
            FHIR R4 patient records, scoped to your organization.
          </Text>
        </div>
        <Button
          leftSection={<UserPlus size={16} />}
          onClick={createHandlers.open}
        >
          New patient
        </Button>
      </Group>

      <Alert
        icon={<Info size={16} />}
        color="blue"
        variant="light"
        mb="md"
        title="Evaluation spike"
      >
        This screen is built from <code>@medplum/react</code> components on the
        existing Mantine theme. Every request goes to{' '}
        <code>/api/v1/fhir/R4</code> on the Sunbird API using your normal
        session — the FHIR server itself is not reachable from the browser.
      </Alert>

      <Paper withBorder radius="md" p={0}>
        <SearchControl
          search={search}
          onChange={(event) => setSearch(event.definition)}
          onClick={(event) => void navigate(`/clinical/patients/${event.resource.id}`)}
          onNew={createHandlers.open}
          hideToolbar={false}
          checkboxesEnabled={false}
        />
      </Paper>

      <Modal
        opened={createOpen}
        onClose={createHandlers.close}
        title="New patient"
        size="xl"
      >
        {/* Generated from the Patient StructureDefinition, not hand-written,
            so it validates against FHIR R4 without a bespoke form. */}
        <ResourceForm
          defaultValue={{ resourceType: 'Patient' }}
          onSubmit={(resource) => void handleCreate(resource)}
        />
      </Modal>
    </Box>
  )
}
