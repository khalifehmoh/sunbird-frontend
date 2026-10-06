import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Box,
  Button,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core'
import { EmrAccess } from '../../../constants/permissions'
import { useHasPermissions } from '../../../hooks/usePermissions'
import { notify } from '../../../lib/notify'
import {
  useCreateDiagnosisMutation,
  useGetDiagnosesQuery,
  useGetPatientEncountersQuery,
  type DiagnosisType,
} from '../../../redux/features/emr/emrApi'
import { PageHeader } from '../shared/PageHeader'
import { PatientPicker } from '../shared/PatientPicker'
import { QueryState } from '../shared/QueryState'
import { PATIENT_CLASS_LABEL, errorMessage, formatDate } from '../shared/format'
import { DiagnosesTable } from '../shared/tables'

const ICD10 = /^[A-TV-Z][0-9][0-9AB](\.[0-9A-TV-Z]{1,4})?$/i
const TYPES: DiagnosisType[] = ['PRIMARY', 'SECONDARY', 'ADMITTING', 'WORKING', 'DISCHARGE']

function DiagnosisForm({ patientId }: { patientId: string }) {
  const { data: encounters } = useGetPatientEncountersQuery(patientId)
  const [create, { isLoading }] = useCreateDiagnosisMutation()
  const [encounterId, setEncounterId] = useState<string | null>(null)
  const [type, setType] = useState<DiagnosisType>('PRIMARY')
  const [code, setCode] = useState('')
  const [display, setDisplay] = useState('')
  const [notes, setNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const codeError = code && !ICD10.test(code.trim().toUpperCase()) ? 'Use an ICD-10 code such as J18.9' : undefined

  async function submit() {
    setSubmitted(true)
    const normalized = code.trim().toUpperCase()
    if (!encounterId || !ICD10.test(normalized) || !display.trim()) return
    try {
      await create({
        patientId,
        encounterId,
        type,
        code: normalized,
        display: display.trim(),
        notes: notes.trim() || undefined,
      }).unwrap()
      notify({ type: 'success', title: 'Diagnosis recorded', message: `${normalized} saved.` })
      setCode('')
      setDisplay('')
      setNotes('')
      setSubmitted(false)
    } catch (err) {
      notify({ type: 'error', title: 'Could not save diagnosis', message: errorMessage(err) })
    }
  }

  return (
    <Paper withBorder radius="md" p="md">
      <Title order={4} mb="sm">
        Add diagnosis
      </Title>
      <Stack>
        <SimpleGrid cols={{ base: 1, md: 2 }}>
          <Select
            label="Encounter"
            required
            placeholder="Select an encounter"
            data={(encounters?.items ?? []).map((e) => ({
              value: e.id,
              label: `${e.visitNumber ?? e.id.slice(0, 8)} · ${PATIENT_CLASS_LABEL[e.patientClass] ?? e.patientClass} · ${formatDate(e.periodStart)}`,
            }))}
            value={encounterId}
            onChange={setEncounterId}
            error={submitted && !encounterId ? 'Select an encounter' : undefined}
          />
          <Select
            label="Type"
            allowDeselect={false}
            data={TYPES}
            value={type}
            onChange={(value) => setType((value as DiagnosisType) ?? 'PRIMARY')}
          />
          <TextInput
            label="ICD-10 code"
            required
            placeholder="J18.9"
            value={code}
            onChange={(event) => setCode(event.currentTarget.value)}
            error={codeError ?? (submitted && !code ? 'Code is required' : undefined)}
          />
          <TextInput
            label="Diagnosis"
            required
            value={display}
            onChange={(event) => setDisplay(event.currentTarget.value)}
            error={submitted && !display.trim() ? 'Description is required' : undefined}
          />
        </SimpleGrid>
        <Textarea label="Notes" minRows={2} value={notes} onChange={(event) => setNotes(event.currentTarget.value)} />
        <Group justify="flex-end">
          <Button loading={isLoading} onClick={() => void submit()}>
            Save diagnosis
          </Button>
        </Group>
      </Stack>
    </Paper>
  )
}

/** Page 21: diagnoses for a patient. */
export function DiagnosesPage() {
  const [params, setParams] = useSearchParams()
  const patientId = params.get('patientId')
  const canCreate = useHasPermissions(EmrAccess.create)
  const { data, isLoading, error } = useGetDiagnosesQuery({
    patientId: patientId ?? undefined,
    limit: 100,
  })
  const rows = data?.items ?? []

  return (
    <Box p="md">
      <PageHeader title="Diagnoses" description="ICD-10 diagnoses recorded against encounters." />
      <Stack>
        <Paper withBorder radius="md" p="md">
          <Box maw={420}>
            <PatientPicker
              value={patientId}
              onChange={(id) => {
                const next = new URLSearchParams(params)
                if (id) next.set('patientId', id)
                else next.delete('patientId')
                setParams(next, { replace: true })
              }}
            />
          </Box>
        </Paper>
        {canCreate && patientId && <DiagnosisForm patientId={patientId} />}
        <QueryState isLoading={isLoading} error={error} empty={rows.length === 0} emptyMessage="No diagnoses recorded.">
          <Paper withBorder radius="md" p="md">
            <DiagnosesTable rows={rows} />
          </Paper>
        </QueryState>
        {!patientId && (
          <Text size="xs" c="dimmed">
            Select a patient to add a diagnosis.
          </Text>
        )}
      </Stack>
    </Box>
  )
}
