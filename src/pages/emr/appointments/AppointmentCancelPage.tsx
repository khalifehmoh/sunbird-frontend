import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Alert, Box, Button, Group, Paper, Stack, Text, Textarea } from '@mantine/core'
import { StatusBadge } from '../../../components/StatusBadge/StatusBadge'
import { notify } from '../../../lib/notify'
import {
  useCancelAppointmentMutation,
  useGetAppointmentQuery,
  useMarkNoShowMutation,
} from '../../../redux/features/emr/emrApi'
import { PageHeader } from '../shared/PageHeader'
import { QueryState } from '../shared/QueryState'
import { APPOINTMENT_STATUS_COLOR, errorMessage, formatDateTime } from '../shared/format'

/** Page 18: cancel (S14) or mark as no-show. */
export function AppointmentCancelPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, error } = useGetAppointmentQuery(id)
  const [cancel, { isLoading: cancelling }] = useCancelAppointmentMutation()
  const [markNoShow, { isLoading: marking }] = useMarkNoShowMutation()
  const [reason, setReason] = useState('')

  const open = data?.status === 'booked' || data?.status === 'pending'

  async function confirmCancel() {
    if (!reason.trim()) return
    try {
      await cancel({ id, reason: reason.trim() }).unwrap()
      notify({
        type: 'success',
        title: 'Appointment cancelled',
        message: 'The patient will be notified.',
      })
      void navigate('/emr/appointments')
    } catch (err) {
      notify({ type: 'error', title: 'Cancel failed', message: errorMessage(err) })
    }
  }

  async function confirmNoShow() {
    try {
      await markNoShow(id).unwrap()
      notify({ type: 'success', title: 'Marked as no-show', message: 'The appointment was updated.' })
      void navigate('/emr/appointments')
    } catch (err) {
      notify({ type: 'error', title: 'Update failed', message: errorMessage(err) })
    }
  }

  return (
    <Box p="md">
      <PageHeader
        title="Cancel appointment"
        crumbs={[{ label: 'Appointments', to: '/emr/appointments' }, { label: 'Cancel' }]}
      />
      <QueryState isLoading={isLoading} error={error}>
        {data && (
          <Paper withBorder radius="md" p="lg" maw={600}>
            <Stack>
              <Group justify="space-between">
                <Text fw={600}>{data.patientName ?? 'Patient'}</Text>
                <StatusBadge value={data.status} colorMap={APPOINTMENT_STATUS_COLOR} variant="light" />
              </Group>
              <Text size="sm" c="dimmed">
                {formatDateTime(data.start)} · {data.practitionerName ?? 'Unassigned'}
                {data.reason ? ` · ${data.reason}` : ''}
              </Text>
              {!open ? (
                <Alert color="gray">
                  This appointment is {data.status} and can no longer be changed.
                  {data.cancellationReason ? ` Reason: ${data.cancellationReason}` : ''}
                </Alert>
              ) : (
                <>
                  <Textarea
                    label="Cancellation reason"
                    required
                    minRows={2}
                    value={reason}
                    onChange={(event) => setReason(event.currentTarget.value)}
                  />
                  <Group justify="space-between">
                    <Button variant="default" onClick={() => void navigate(-1)}>
                      Keep appointment
                    </Button>
                    <Group>
                      <Button variant="light" color="orange" loading={marking} onClick={() => void confirmNoShow()}>
                        Mark no-show
                      </Button>
                      <Button color="red" loading={cancelling} disabled={!reason.trim()} onClick={() => void confirmCancel()}>
                        Cancel appointment
                      </Button>
                    </Group>
                  </Group>
                </>
              )}
            </Stack>
          </Paper>
        )}
      </QueryState>
    </Box>
  )
}
