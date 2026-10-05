import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Alert,
  Button,
  Group,
  Loader,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  TextInput,
  Textarea,
} from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import type { Encounter, Practitioner } from '@medplum/fhirtypes'
import { ResourceInput, useMedplum, useResource } from '@medplum/react'
import {
  useDischargePatientMutation,
  useGetAdtEncounterQuery,
} from '../../../redux/features/adt/adtApi'
import { notify } from '../../../lib/notify'
import { adtErrorMessage } from './adtError'
import { AdtPatientShell } from './AdtPatientShell'
import { DischargeNotificationsPanel } from './DischargeNotificationsPanel'

function DischargeForm({ encounterId }: { encounterId: string }) {
  const navigate = useNavigate()
  const medplum = useMedplum()
  const encounter = useResource<Encounter>({
    reference: `Encounter/${encounterId}`,
  })
  const { data: summary } = useGetAdtEncounterQuery(encounterId)
  const [discharge, { isLoading }] = useDischargePatientMutation()
  const [dischargeAt, setDischargeAt] = useState<string | null>(
    new Date().toISOString().slice(0, 16),
  )
  const [disposition, setDisposition] = useState<string | null>('home')
  const [condition, setCondition] = useState<string | null>('improved')
  const [diagnosisCode, setDiagnosisCode] = useState('')
  const [diagnosisDisplay, setDiagnosisDisplay] = useState('')
  const [attendingId, setAttendingId] = useState<string | undefined>()
  const [dischargedId, setDischargedId] = useState<string | undefined>()

  async function submit() {
    if (!dischargeAt || !disposition || !condition) {
      notify({
        type: 'error',
        title: 'Missing fields',
        message: 'Discharge time, disposition, and condition are required.',
      })
      return
    }
    try {
      const result = await discharge({
        encounterId,
        dischargeDateTime: new Date(dischargeAt).toISOString(),
        dischargeDisposition: disposition,
        dischargeCondition: condition,
        attendingPractitionerId: attendingId,
        dischargeDiagnosisCode: diagnosisCode || undefined,
        dischargeDiagnosisDisplay: diagnosisDisplay || undefined,
      }).unwrap()
      notify({
        type: 'success',
        title: 'Patient discharged',
        message: `Encounter ${result.visitNumber ?? result.id} finished (A03).`,
      })
      medplum.invalidateUrl(`Encounter/${result.id}`)
      medplum.invalidateSearches('Encounter')
      // Stay here and open the live SSE watch immediately — navigating first
      // means both Communications are usually already written before the panel mounts.
      setDischargedId(result.id)
      void medplum.readResource('Encounter', result.id).catch(() => undefined)
    } catch (error) {
      notify({
        type: 'error',
        title: 'Discharge failed',
        message: adtErrorMessage(error),
      })
    }
  }

  if (!encounter) {
    return (
      <Group justify="center" p="xl">
        <Loader />
      </Group>
    )
  }

  if (dischargedId) {
    return (
      <Stack gap="md">
        <Alert color="teal" title="Patient discharged">
          Watching Bot + BullMQ notification paths live (API SSE, demo pace).
        </Alert>
        <DischargeNotificationsPanel encounterId={dischargedId} watch />
        <Group justify="flex-end">
          <Button
            onClick={() =>
              void navigate(`/clinical/encounters/${dischargedId}`)
            }
          >
            Open encounter
          </Button>
        </Group>
      </Stack>
    )
  }

  return (
    <Paper withBorder radius="md" p="md">
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Stack>
          <DateTimePicker
            label="Discharge date/time"
            required
            value={dischargeAt}
            onChange={setDischargeAt}
          />
          <Select
            label="Discharge disposition"
            required
            data={[
              { value: 'home', label: 'Home' },
              { value: 'alt-home', label: 'Alternative home' },
              { value: 'other-hcf', label: 'Other healthcare facility' },
              { value: 'hosp', label: 'Hospice' },
              { value: 'long', label: 'Long-term care' },
              { value: 'aadvice', label: 'Left against advice' },
              { value: 'exp', label: 'Expired' },
              { value: 'oth', label: 'Other' },
            ]}
            value={disposition}
            onChange={setDisposition}
          />
          <Select
            label="Discharge condition"
            required
            data={[
              { value: 'improved', label: 'Improved' },
              { value: 'stable', label: 'Stable' },
              { value: 'worsened', label: 'Worsened' },
              { value: 'expired', label: 'Expired' },
            ]}
            value={condition}
            onChange={setCondition}
          />
        </Stack>
        <Stack>
          <TextInput
            label="Length of stay"
            readOnly
            value={
              summary?.lengthOfStayDays
                ? `${summary.lengthOfStayDays} day(s)`
                : '—'
            }
          />
          <ResourceInput
            resourceType="Practitioner"
            name="attending-discharge"
            placeholder="Attending provider"
            onChange={(resource) =>
              setAttendingId((resource as Practitioner | undefined)?.id)
            }
          />
          <TextInput
            label="Discharge diagnosis code"
            value={diagnosisCode}
            onChange={(e) => setDiagnosisCode(e.currentTarget.value)}
          />
          <Textarea
            label="Discharge diagnosis"
            value={diagnosisDisplay}
            onChange={(e) => setDiagnosisDisplay(e.currentTarget.value)}
            minRows={2}
          />
        </Stack>
      </SimpleGrid>
      <Group justify="flex-end" mt="lg">
        <Button variant="default" onClick={() => void navigate(-1)}>
          Cancel
        </Button>
        <Button loading={isLoading} onClick={() => void submit()}>
          Confirm discharge
        </Button>
      </Group>
    </Paper>
  )
}

export function DischargePage() {
  const [params] = useSearchParams()
  const encounterId = params.get('encounter') ?? undefined

  return (
    <AdtPatientShell
      title="Discharge patient"
      eventCode="ADT A03"
      description="Finishes the inpatient Encounter, records disposition, and frees the bed."
    >
      {() =>
        encounterId ? (
          <DischargeForm encounterId={encounterId} />
        ) : (
          <Alert color="yellow" title="Select an encounter">
            Open discharge from an active inpatient encounter, or add{' '}
            <code>?encounter=&lt;id&gt;</code> to the URL.
          </Alert>
        )
      }
    </AdtPatientShell>
  )
}
