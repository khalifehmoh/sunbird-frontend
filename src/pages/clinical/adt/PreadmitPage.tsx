import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Textarea,
} from '@mantine/core'
import { DateInput } from '@mantine/dates'
import type { Patient, Practitioner } from '@medplum/fhirtypes'
import { ResourceInput } from '@medplum/react'
import { usePreadmitPatientMutation } from '../../../redux/features/adt/adtApi'
import { notify } from '../../../lib/notify'
import { adtErrorMessage } from './adtError'
import { AdtPatientShell } from './AdtPatientShell'
import { LocationSelect, useLocationOptions } from './locationOptions'

function PreadmitForm({ patient }: { patient: Patient }) {
  const navigate = useNavigate()
  const [preadmit, { isLoading }] = usePreadmitPatientMutation()
  const { wards, isLoading: locLoading } = useLocationOptions()
  const [plannedStart, setPlannedStart] = useState<string | null>(null)
  const [wardLocationId, setWardLocationId] = useState<string | null>(null)
  const [procedure, setProcedure] = useState('')
  const [status, setStatus] = useState<string | null>('pending')
  const [attendingId, setAttendingId] = useState<string | undefined>()

  async function submit() {
    if (!patient.id || !plannedStart) {
      notify({
        type: 'error',
        title: 'Missing fields',
        message: 'Planned start date is required.',
      })
      return
    }
    try {
      const result = await preadmit({
        patientId: patient.id,
        plannedStartDate: plannedStart.slice(0, 10),
        wardLocationId: wardLocationId ?? undefined,
        plannedProcedure: procedure || undefined,
        attendingPractitionerId: attendingId,
        status: status ?? 'pending',
      }).unwrap()
      notify({
        type: 'success',
        title: 'Pre-admission saved',
        message: `Visit ${result.visitNumber ?? result.id} planned (A05).`,
      })
      void navigate(`/clinical/encounters/${result.id}`)
    } catch (error) {
      notify({
        type: 'error',
        title: 'Pre-admission failed',
        message: adtErrorMessage(error),
      })
    }
  }

  return (
    <Paper withBorder radius="md" p="md">
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Stack>
          <DateInput
            label="Planned start date"
            required
            value={plannedStart}
            onChange={setPlannedStart}
          />
          <LocationSelect
            label="Planned ward"
            placeholder={locLoading ? 'Loading…' : 'Select ward'}
            value={wardLocationId}
            onChange={setWardLocationId}
            options={wards}
          />
          <Select
            label="Pre-admission status"
            data={[
              { value: 'pending', label: 'Pending' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
            value={status}
            onChange={setStatus}
          />
        </Stack>
        <Stack>
          <Textarea
            label="Planned procedure"
            value={procedure}
            onChange={(e) => setProcedure(e.currentTarget.value)}
            minRows={4}
            placeholder="Elective laparoscopic cholecystectomy"
          />
          <ResourceInput
            resourceType="Practitioner"
            name="attending-preadmit"
            placeholder="Attending provider"
            onChange={(resource) =>
              setAttendingId((resource as Practitioner | undefined)?.id)
            }
          />
        </Stack>
      </SimpleGrid>
      <Group justify="flex-end" mt="lg">
        <Button variant="default" onClick={() => void navigate(-1)}>
          Cancel
        </Button>
        <Button loading={isLoading} onClick={() => void submit()}>
          Save pre-admission
        </Button>
      </Group>
    </Paper>
  )
}

export function PreadmitPage() {
  return (
    <AdtPatientShell
      title="Pre-admission"
      eventCode="ADT A05"
      description="Creates a planned inpatient Encounter (status=planned) convertible to A01 on admit day."
    >
      {(patient) => <PreadmitForm patient={patient} />}
    </AdtPatientShell>
  )
}
