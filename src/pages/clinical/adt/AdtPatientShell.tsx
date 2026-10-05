import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Alert,
  Badge,
  Box,
  Breadcrumbs,
  Anchor,
  Grid,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import type { Patient } from '@medplum/fhirtypes'
import { PatientSummary, ResourceInput } from '@medplum/react'

type AdtPatientShellProps = {
  title: string
  eventCode: string
  description: string
  children: (patient: Patient) => ReactNode
  /** When true, patient must already be selected via ?patient= */
  requirePatient?: boolean
}

/**
 * Shared ADT page chrome: FHIR patient picker + Medplum `PatientSummary`
 * beside the action form. Medplum owns the clinical summary; Nest owns the
 * ADT write actions the form submits.
 */
export function AdtPatientShell({
  title,
  eventCode,
  description,
  children,
}: AdtPatientShellProps) {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const patientId = params.get('patient') ?? undefined
  const [picked, setPicked] = useState<Patient | undefined>()

  const patientRef = useMemo(
    () => (patientId ? { reference: `Patient/${patientId}` } : undefined),
    [patientId],
  )

  return (
    <Box p="xl">
      <Breadcrumbs mb="sm">
        <Anchor onClick={() => void navigate('/clinical/encounters')} size="sm">
          Encounters
        </Anchor>
        <Text size="sm">{title}</Text>
      </Breadcrumbs>

      <Group justify="space-between" align="flex-start" mb="md">
        <div>
          <Group gap="sm" mb={4}>
            <Title order={1}>{title}</Title>
            <Badge variant="light">{eventCode}</Badge>
          </Group>
          <Text c="dimmed" size="sm">
            {description}
          </Text>
        </div>
      </Group>

      <Paper withBorder radius="md" p="md" mb="md">
        <Text size="sm" fw={500} mb="xs">
          Patient
        </Text>
        <ResourceInput
          resourceType="Patient"
          name="adt-patient"
          placeholder="Search by name or MRN"
          defaultValue={patientRef}
          onChange={(resource) => {
            const next = resource as Patient | undefined
            setPicked(next)
            const nextParams = new URLSearchParams(params)
            if (next?.id) {
              nextParams.set('patient', next.id)
            } else {
              nextParams.delete('patient')
            }
            setParams(nextParams, { replace: true })
          }}
        />
      </Paper>

      {!patientId && (
        <Alert color="blue" variant="light" title="Select a patient">
          Choose a patient to load the Medplum clinical summary and continue
          with this ADT event.
        </Alert>
      )}

      {patientId && (
        <Grid gutter="md">
          <Grid.Col span={{ base: 12, lg: 4 }}>
            <Paper withBorder radius="md" p="md">
              <PatientSummary patient={{ reference: `Patient/${patientId}` }} />
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, lg: 8 }}>
            <Stack>
              {picked || patientId
                ? children(
                    picked ??
                      ({
                        resourceType: 'Patient',
                        id: patientId,
                      } as Patient),
                  )
                : null}
            </Stack>
          </Grid.Col>
        </Grid>
      )}
    </Box>
  )
}
