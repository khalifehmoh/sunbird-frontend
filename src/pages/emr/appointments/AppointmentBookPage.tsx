import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Box,
  Button,
  Grid,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { notify } from '../../../lib/notify'
import {
  useBookAppointmentMutation,
  useGetClinicQuery,
  useGetProvidersQuery,
  useGetSlotsQuery,
  type AppointmentType,
} from '../../../redux/features/emr/emrApi'
import { PageHeader } from '../shared/PageHeader'
import { PatientPicker } from '../shared/PatientPicker'
import { QueryState } from '../shared/QueryState'
import {
  addDays,
  clinicClock,
  errorMessage,
  formatDateTime,
  toLocalIsoDate,
  weekdayLabel,
} from '../shared/format'

const TYPES: { value: AppointmentType; label: string }[] = [
  { value: 'ROUTINE', label: 'Routine' },
  { value: 'CHECKUP', label: 'Check-up' },
  { value: 'FOLLOWUP', label: 'Follow-up' },
  { value: 'WALKIN', label: 'Walk-in' },
  { value: 'EMERGENCY', label: 'Emergency' },
]

/** Page 17: patient and details on the left, slot picker on the right. */
export function AppointmentBookPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [patientId, setPatientId] = useState<string | null>(params.get('patientId'))
  const [providerId, setProviderId] = useState<string | null>(params.get('practitionerId'))
  const [start, setStart] = useState<string | null>(params.get('start'))
  const [type, setType] = useState<AppointmentType>('ROUTINE')
  const [reason, setReason] = useState('')
  const [from, setFrom] = useState(() => toLocalIsoDate(new Date()))
  const [submitted, setSubmitted] = useState(false)
  const [book, { isLoading: booking }] = useBookAppointmentMutation()

  const { data: clinic } = useGetClinicQuery()
  const { data: providers } = useGetProvidersQuery()
  useEffect(() => {
    if (!providerId && providers?.items.length) setProviderId(providers.items[0].id)
  }, [providers, providerId])

  const { data: slots, isLoading, error } = useGetSlotsQuery(
    { practitionerId: providerId ?? '', from, days: 7 },
    { skip: !providerId },
  )
  const offset = clinic?.utcOffsetMinutes ?? 0

  async function submit() {
    setSubmitted(true)
    if (!patientId || !providerId || !start) return
    try {
      const row = await book({
        patientId,
        practitionerId: providerId,
        start,
        type,
        reason: reason.trim() || undefined,
      }).unwrap()
      notify({
        type: 'success',
        title: 'Appointment booked',
        message: `${row.patientName ?? 'Patient'} on ${formatDateTime(row.start)}.`,
      })
      void navigate('/emr/appointments')
    } catch (err) {
      notify({ type: 'error', title: 'Booking failed', message: errorMessage(err) })
    }
  }

  return (
    <Box p="md">
      <PageHeader
        title="Book appointment"
        crumbs={[{ label: 'Appointments', to: '/emr/appointments' }, { label: 'Book' }]}
      />
      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Paper withBorder radius="md" p="lg">
            <Stack>
              <PatientPicker
                required
                value={patientId}
                onChange={(id) => setPatientId(id)}
                error={submitted && !patientId ? 'Select a patient' : undefined}
              />
              <Select
                label="Provider"
                required
                searchable
                data={(providers?.items ?? []).map((p) => ({ value: p.id, label: p.name }))}
                value={providerId}
                onChange={(value) => {
                  setProviderId(value)
                  setStart(null)
                }}
              />
              <Select
                label="Type"
                allowDeselect={false}
                data={TYPES}
                value={type}
                onChange={(value) => setType((value as AppointmentType) ?? 'ROUTINE')}
              />
              <TextInput
                label="Reason"
                value={reason}
                onChange={(event) => setReason(event.currentTarget.value)}
              />
              <Paper withBorder p="xs" radius="sm">
                <Text size="xs" c="dimmed">
                  Selected slot
                </Text>
                <Text fw={600} c={submitted && !start ? 'red' : undefined}>
                  {start ? formatDateTime(start) : 'Pick a slot on the right'}
                </Text>
              </Paper>
              <Group justify="flex-end">
                <Button variant="default" onClick={() => void navigate(-1)}>
                  Cancel
                </Button>
                <Button loading={booking} onClick={() => void submit()}>
                  Book
                </Button>
              </Group>
            </Stack>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 7 }}>
          <Paper withBorder radius="md" p="lg">
            <Group justify="space-between" mb="sm">
              <Title order={4}>Available slots</Title>
              <TextInput
                type="date"
                value={from}
                min={toLocalIsoDate(new Date())}
                onChange={(event) => setFrom(event.currentTarget.value || from)}
              />
            </Group>
            <QueryState
              isLoading={!!providerId && isLoading}
              error={error}
              empty={!providerId}
              emptyMessage="Choose a provider to see availability."
            >
              <Stack gap="sm">
                {(slots?.days ?? []).map((day) => {
                  const free = day.slots.filter((slot) => slot.status === 'free')
                  return (
                    <div key={day.date}>
                      <Text size="sm" fw={600}>
                        {weekdayLabel(day.date)}
                        {!day.working && (
                          <Text span c="dimmed" fw={400}>
                            {' '}
                            — closed
                          </Text>
                        )}
                      </Text>
                      {day.working &&
                        (free.length === 0 ? (
                          <Text size="xs" c="dimmed">
                            Fully booked
                          </Text>
                        ) : (
                          <SimpleGrid cols={{ base: 4, sm: 6 }} spacing={6} mt={4}>
                            {free.map((slot) => (
                              <Button
                                key={slot.start}
                                size="compact-sm"
                                variant={start === slot.start ? 'filled' : 'light'}
                                onClick={() => setStart(slot.start)}
                              >
                                {clinicClock(slot.start, offset)}
                              </Button>
                            ))}
                          </SimpleGrid>
                        ))}
                    </div>
                  )
                })}
                <Button
                  variant="subtle"
                  size="xs"
                  onClick={() => setFrom(addDays(from, 7))}
                >
                  Next 7 days
                </Button>
              </Stack>
            </QueryState>
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  )
}
