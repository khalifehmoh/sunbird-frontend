import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Alert,
  Button,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core'
import type { Encounter, Patient, Practitioner } from '@medplum/fhirtypes'
import { ResourceInput, useMedplum, useResource } from '@medplum/react'
import {
  useGetAdtEncounterQuery,
  useTransferPatientMutation,
} from '../../../redux/features/adt/adtApi'
import { notify } from '../../../lib/notify'
import { adtErrorMessage } from './adtError'
import { AdtPatientShell } from './AdtPatientShell'
import { LocationSelect, useLocationOptions } from './locationOptions'

function TransferForm({
  patient,
  encounterId,
}: {
  patient: Patient
  encounterId: string
}) {
  const navigate = useNavigate()
  const medplum = useMedplum()
  const encounter = useResource<Encounter>({
    reference: `Encounter/${encounterId}`,
  })
  const { data: summary } = useGetAdtEncounterQuery(encounterId)
  const [transfer, { isLoading }] = useTransferPatientMutation()
  const { freeBeds, isLoading: bedsLoading } = useLocationOptions()
  const [bedLocationId, setBedLocationId] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [attendingId, setAttendingId] = useState<string | undefined>()

  useEffect(() => {
    if (!encounter) return
    const subjectId = encounter.subject?.reference?.replace(/^Patient\//, '')
    if (subjectId && subjectId !== patient.id) {
      notify({
        type: 'error',
        title: 'Patient mismatch',
        message: 'Selected encounter does not belong to this patient.',
      })
    }
  }, [encounter, patient.id])

  async function submit() {
    if (!bedLocationId || !reason.trim()) {
      notify({
        type: 'error',
        title: 'Missing fields',
        message: 'Destination bed and transfer reason are required.',
      })
      return
    }
    try {
      const result = await transfer({
        encounterId,
        bedLocationId,
        transferReason: reason.trim(),
        attendingPractitionerId: attendingId,
      }).unwrap()
      notify({
        type: 'success',
        title: 'Patient transferred',
        message: `Encounter ${result.visitNumber ?? result.id} updated (A02).`,
      })
      void navigate(`/clinical/encounters/${result.id}`)
      void medplum.invalidateSearches('Encounter')
    } catch (error) {
      notify({
        type: 'error',
        title: 'Transfer failed',
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

  const current =
    encounter.location?.find((entry) => entry.status === 'active') ??
    encounter.location?.[encounter.location.length - 1]

  return (
    <Paper withBorder radius="md" p="md">
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Stack>
          <Text fw={600}>Current location (from)</Text>
          <TextInput
            label="Location"
            value={
              summary?.locationDisplay ??
              current?.location?.display ??
              current?.location?.reference ??
              '—'
            }
            readOnly
          />
          <Text size="sm" c="dimmed">
            Visit {summary?.visitNumber ?? '—'} · status {encounter.status}
          </Text>
        </Stack>
        <Stack>
          <Text fw={600}>New location (to)</Text>
          <LocationSelect
            label="Bed"
            required
            placeholder={bedsLoading ? 'Loading beds…' : 'Select free bed'}
            value={bedLocationId}
            onChange={setBedLocationId}
            options={freeBeds}
          />
          <Textarea
            label="Transfer reason"
            required
            value={reason}
            onChange={(e) => setReason(e.currentTarget.value)}
            minRows={3}
          />
          <ResourceInput
            resourceType="Practitioner"
            name="attending-transfer"
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
          Confirm transfer
        </Button>
      </Group>
    </Paper>
  )
}

export function TransferPage() {
  const [params] = useSearchParams()
  const encounterId = params.get('encounter') ?? undefined

  return (
    <AdtPatientShell
      title="Transfer patient"
      eventCode="ADT A02"
      description="Appends Encounter.location history and moves bed occupancy."
    >
      {(patient) =>
        encounterId ? (
          <TransferForm patient={patient} encounterId={encounterId} />
        ) : (
          <Alert color="yellow" title="Select an encounter">
            Open transfer from an active inpatient encounter, or add{' '}
            <code>?encounter=&lt;id&gt;</code> to the URL.
          </Alert>
        )
      }
    </AdtPatientShell>
  )
}
