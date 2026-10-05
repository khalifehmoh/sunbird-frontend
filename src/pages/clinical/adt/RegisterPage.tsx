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
import { DateTimePicker } from '@mantine/dates'
import type { Patient, Practitioner } from '@medplum/fhirtypes'
import { ResourceInput } from '@medplum/react'
import { useRegisterVisitMutation } from '../../../redux/features/adt/adtApi'
import { notify } from '../../../lib/notify'
import { adtErrorMessage } from './adtError'
import { AdtPatientShell } from './AdtPatientShell'
import { LocationSelect, useLocationOptions } from './locationOptions'

function RegisterForm({ patient }: { patient: Patient }) {
  const navigate = useNavigate()
  const [register, { isLoading }] = useRegisterVisitMutation()
  const { clinics, isLoading: locLoading } = useLocationOptions()
  const [patientClass, setPatientClass] = useState<'AMB' | 'EMER' | null>('AMB')
  const [locationId, setLocationId] = useState<string | null>(null)
  const [attendingId, setAttendingId] = useState<string | undefined>()
  const [visitReason, setVisitReason] = useState('')
  const [triageCategory, setTriageCategory] = useState<string | null>('non-urgent')
  const [arrivalMode, setArrivalMode] = useState<string | null>('walk-in')
  const [registeredAt, setRegisteredAt] = useState<string | null>(
    new Date().toISOString().slice(0, 16),
  )

  async function submit() {
    if (!patient.id || !patientClass) {
      notify({
        type: 'error',
        title: 'Missing fields',
        message: 'Patient class is required.',
      })
      return
    }
    try {
      const result = await register({
        patientId: patient.id,
        patientClass,
        locationId: locationId ?? undefined,
        attendingPractitionerId: attendingId,
        registrationDateTime: registeredAt
          ? new Date(registeredAt).toISOString()
          : undefined,
        visitReason: visitReason || undefined,
        triageCategory: triageCategory ?? undefined,
        arrivalMode: arrivalMode ?? undefined,
      }).unwrap()
      notify({
        type: 'success',
        title: 'Visit registered',
        message: `Visit ${result.visitNumber ?? result.id} created (A04).`,
      })
      void navigate(`/clinical/encounters/${result.id}`)
    } catch (error) {
      notify({
        type: 'error',
        title: 'Registration failed',
        message: adtErrorMessage(error),
      })
    }
  }

  return (
    <Paper withBorder radius="md" p="md">
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Stack>
          <Select
            label="Patient class"
            required
            data={[
              { value: 'AMB', label: 'Outpatient (OPD)' },
              { value: 'EMER', label: 'Emergency (ED)' },
            ]}
            value={patientClass}
            onChange={(value) => setPatientClass(value as 'AMB' | 'EMER' | null)}
          />
          <LocationSelect
            label="Location"
            placeholder={locLoading ? 'Loading…' : 'Clinic or ED'}
            value={locationId}
            onChange={setLocationId}
            options={clinics}
          />
          <ResourceInput
            resourceType="Practitioner"
            name="attending-register"
            placeholder="Attending provider"
            onChange={(resource) =>
              setAttendingId((resource as Practitioner | undefined)?.id)
            }
          />
          <DateTimePicker
            label="Registration date/time"
            value={registeredAt}
            onChange={setRegisteredAt}
          />
        </Stack>
        <Stack>
          <Textarea
            label="Visit reason"
            value={visitReason}
            onChange={(e) => setVisitReason(e.currentTarget.value)}
            minRows={3}
            placeholder="Consult / checkup"
          />
          <Select
            label="Triage category"
            data={[
              { value: 'immediate', label: 'Immediate' },
              { value: 'very-urgent', label: 'Very urgent' },
              { value: 'urgent', label: 'Urgent' },
              { value: 'standard', label: 'Standard' },
              { value: 'non-urgent', label: 'Non-urgent' },
            ]}
            value={triageCategory}
            onChange={setTriageCategory}
            clearable
          />
          <Select
            label="Arrival mode"
            data={[
              { value: 'walk-in', label: 'Walk-in' },
              { value: 'ambulance', label: 'Ambulance' },
              { value: 'referral', label: 'Referral' },
              { value: 'other', label: 'Other' },
            ]}
            value={arrivalMode}
            onChange={setArrivalMode}
            clearable
          />
        </Stack>
      </SimpleGrid>
      <Group justify="flex-end" mt="lg">
        <Button variant="default" onClick={() => void navigate(-1)}>
          Cancel
        </Button>
        <Button loading={isLoading} onClick={() => void submit()}>
          Register visit
        </Button>
      </Group>
    </Paper>
  )
}

export function RegisterVisitPage() {
  return (
    <AdtPatientShell
      title="Register OPD / ED"
      eventCode="ADT A04"
      description="Creates a FHIR ambulatory or emergency Encounter (class=AMB|EMER)."
    >
      {(patient) => <RegisterForm patient={patient} />}
    </AdtPatientShell>
  )
}
