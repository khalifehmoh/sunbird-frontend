import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  TextInput,
  Textarea,
} from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import type { Patient, Practitioner } from '@medplum/fhirtypes'
import { ResourceInput } from '@medplum/react'
import { useAdmitPatientMutation } from '../../../redux/features/adt/adtApi'
import { notify } from '../../../lib/notify'
import { adtErrorMessage } from './adtError'
import { AdtPatientShell } from './AdtPatientShell'
import { LocationSelect, useLocationOptions } from './locationOptions'

function AdmitForm({ patient }: { patient: Patient }) {
  const navigate = useNavigate()
  const [admit, { isLoading }] = useAdmitPatientMutation()
  const { freeBeds, isLoading: bedsLoading } = useLocationOptions()
  const [admitType, setAdmitType] = useState<string | null>('routine')
  const [admitSource, setAdmitSource] = useState<string | null>('phys-ref')
  const [bedLocationId, setBedLocationId] = useState<string | null>(null)
  const [attendingId, setAttendingId] = useState<string | undefined>()
  const [diagnosisCode, setDiagnosisCode] = useState('')
  const [diagnosisDisplay, setDiagnosisDisplay] = useState('')
  const [hospitalService, setHospitalService] = useState('Medicine')
  const [admitAt, setAdmitAt] = useState<string | null>(
    new Date().toISOString().slice(0, 16),
  )

  async function submit() {
    if (!patient.id || !admitType || !bedLocationId) {
      notify({
        type: 'error',
        title: 'Missing fields',
        message: 'Admit type and bed are required.',
      })
      return
    }
    try {
      const result = await admit({
        patientId: patient.id,
        admitType,
        admitSource: admitSource ?? undefined,
        bedLocationId,
        attendingPractitionerId: attendingId,
        primaryDiagnosisCode: diagnosisCode || undefined,
        primaryDiagnosisDisplay: diagnosisDisplay || undefined,
        hospitalService: hospitalService || undefined,
        admitDateTime: admitAt
          ? new Date(admitAt).toISOString()
          : undefined,
      }).unwrap()
      notify({
        type: 'success',
        title: 'Patient admitted',
        message: `Visit ${result.visitNumber ?? result.id} created (A01).`,
      })
      void navigate(`/clinical/encounters/${result.id}`)
    } catch (error) {
      notify({
        type: 'error',
        title: 'Admit failed',
        message: adtErrorMessage(error),
      })
    }
  }

  return (
    <Paper withBorder radius="md" p="md">
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Stack>
          <Select
            label="Admission type"
            required
            data={[
              { value: 'routine', label: 'Routine' },
              { value: 'urgent', label: 'Urgent' },
              { value: 'elective', label: 'Elective' },
              { value: 'emergency', label: 'Emergency' },
            ]}
            value={admitType}
            onChange={setAdmitType}
          />
          <Select
            label="Admission source"
            data={[
              { value: 'phys-ref', label: 'Physician referral' },
              { value: 'emd', label: 'From emergency' },
              { value: 'outp', label: 'From outpatient' },
              { value: 'gp', label: 'GP referral' },
              { value: 'other', label: 'Other' },
            ]}
            value={admitSource}
            onChange={setAdmitSource}
            clearable
          />
          <LocationSelect
            label="Bed"
            required
            placeholder={bedsLoading ? 'Loading beds…' : 'Select free bed'}
            value={bedLocationId}
            onChange={setBedLocationId}
            options={freeBeds}
          />
          <ResourceInput
            resourceType="Practitioner"
            name="attending"
            placeholder="Attending provider"
            onChange={(resource) =>
              setAttendingId((resource as Practitioner | undefined)?.id)
            }
          />
        </Stack>
        <Stack>
          <TextInput
            label="Primary diagnosis code (ICD-10)"
            value={diagnosisCode}
            onChange={(e) => setDiagnosisCode(e.currentTarget.value)}
            placeholder="J18.9"
          />
          <Textarea
            label="Primary diagnosis"
            value={diagnosisDisplay}
            onChange={(e) => setDiagnosisDisplay(e.currentTarget.value)}
            placeholder="Lobar pneumonia"
            minRows={2}
          />
          <TextInput
            label="Hospital service"
            value={hospitalService}
            onChange={(e) => setHospitalService(e.currentTarget.value)}
          />
          <DateTimePicker
            label="Admit date/time"
            value={admitAt}
            onChange={setAdmitAt}
            required
          />
        </Stack>
      </SimpleGrid>
      <Group justify="flex-end" mt="lg">
        <Button variant="default" onClick={() => void navigate(-1)}>
          Cancel
        </Button>
        <Button loading={isLoading} onClick={() => void submit()}>
          Admit patient
        </Button>
      </Group>
    </Paper>
  )
}

export function AdmitPage() {
  return (
    <AdtPatientShell
      title="Admit inpatient"
      eventCode="ADT A01"
      description="Creates a FHIR inpatient Encounter (class=IMP) and occupies the selected bed."
    >
      {(patient) => <AdmitForm patient={patient} />}
    </AdtPatientShell>
  )
}
