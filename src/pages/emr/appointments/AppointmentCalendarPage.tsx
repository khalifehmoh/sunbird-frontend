import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ActionIcon,
  Box,
  Button,
  Group,
  Paper,
  Select,
  Table,
  Text,
  UnstyledButton,
} from '@mantine/core'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { EmrAccess } from '../../../constants/permissions'
import { useHasPermissions } from '../../../hooks/usePermissions'
import {
  useGetAppointmentsQuery,
  useGetClinicQuery,
  useGetProvidersQuery,
  useGetSlotsQuery,
  type AppointmentRow,
} from '../../../redux/features/emr/emrApi'
import { PageHeader } from '../shared/PageHeader'
import { QueryState } from '../shared/QueryState'
import {
  addDays,
  clinicClock,
  formatDate,
  toLocalIsoDate,
  weekStartOf,
  weekdayLabel,
} from '../shared/format'

/** Page 16: one provider's week, slot by slot. */
export function AppointmentCalendarPage() {
  const navigate = useNavigate()
  const canBook = useHasPermissions(EmrAccess.appointmentsBook)
  const canManage = useHasPermissions(EmrAccess.appointmentsManage)
  const [providerId, setProviderId] = useState<string | null>(null)
  const [weekStart, setWeekStart] = useState(() => weekStartOf(new Date()))

  const { data: clinic } = useGetClinicQuery()
  const { data: providers, isLoading: loadingProviders, error: providerError } =
    useGetProvidersQuery()

  useEffect(() => {
    if (!providerId && providers?.items.length) setProviderId(providers.items[0].id)
  }, [providers, providerId])

  const { data: slotData, isLoading, error } = useGetSlotsQuery(
    { practitionerId: providerId ?? '', from: weekStart, days: 7 },
    { skip: !providerId },
  )
  const { data: appointments } = useGetAppointmentsQuery(
    {
      practitionerId: providerId ?? undefined,
      from: new Date(`${weekStart}T00:00:00`).toISOString(),
      to: new Date(`${addDays(weekStart, 7)}T00:00:00`).toISOString(),
      limit: 200,
    },
    { skip: !providerId },
  )

  const days = useMemo(() => slotData?.days ?? [], [slotData])
  const byStart = useMemo(() => {
    const map = new Map<number, AppointmentRow>()
    for (const row of appointments?.items ?? []) {
      if (row.start && row.status !== 'cancelled') {
        map.set(new Date(row.start).getTime(), row)
      }
    }
    return map
  }, [appointments])

  const rowCount = Math.max(0, ...days.map((day) => day.slots.length))
  const offset = clinic?.utcOffsetMinutes ?? 0
  const referenceDay = days.find((day) => day.slots.length === rowCount)
  const today = toLocalIsoDate(new Date())

  return (
    <Box p="md">
      <PageHeader
        title="Appointments"
        description="Weekly schedule by provider."
        actions={
          canBook && (
            <Button
              component={Link}
              to={`/emr/appointments/new${providerId ? `?practitionerId=${providerId}` : ''}`}
              leftSection={<Plus size={16} />}
            >
              Book appointment
            </Button>
          )
        }
      />
      <Paper withBorder radius="md" p="md" mb="md">
        <Group justify="space-between">
          <Select
            label="Provider"
            placeholder={loadingProviders ? 'Loading…' : 'Select a provider'}
            data={(providers?.items ?? []).map((p) => ({ value: p.id, label: p.name }))}
            value={providerId}
            onChange={setProviderId}
            searchable
            miw={260}
          />
          <Group gap="xs">
            <ActionIcon variant="default" onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Previous week">
              <ChevronLeft size={16} />
            </ActionIcon>
            <Text fw={600} miw={200} ta="center">
              {formatDate(weekStart)} – {formatDate(addDays(weekStart, 6))}
            </Text>
            <ActionIcon variant="default" onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Next week">
              <ChevronRight size={16} />
            </ActionIcon>
            <Button variant="default" size="xs" onClick={() => setWeekStart(weekStartOf(new Date()))}>
              This week
            </Button>
          </Group>
        </Group>
      </Paper>

      <QueryState
        isLoading={loadingProviders || (!!providerId && isLoading)}
        error={providerError ?? error}
        empty={!providerId}
        emptyMessage="No providers are available."
      >
        <Paper withBorder radius="md" p="xs">
          <Table.ScrollContainer minWidth={760}>
            <Table withColumnBorders verticalSpacing={2}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w={70} />
                  {days.map((day) => (
                    <Table.Th
                      key={day.date}
                      ta="center"
                      bg={day.date === today ? 'var(--mantine-color-blue-light)' : undefined}
                    >
                      {weekdayLabel(day.date)}
                    </Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {Array.from({ length: rowCount }, (_, index) => (
                  <Table.Tr key={index}>
                    <Table.Td c="dimmed" fz="xs">
                      {referenceDay ? clinicClock(referenceDay.slots[index].start, offset) : ''}
                    </Table.Td>
                    {days.map((day) => {
                      const slot = day.slots[index]
                      if (!slot) return <Table.Td key={day.date} />
                      const appointment = byStart.get(new Date(slot.start).getTime())
                      if (slot.status === 'blocked') {
                        return (
                          <Table.Td key={day.date} bg="var(--mantine-color-gray-light)" />
                        )
                      }
                      if (slot.status === 'booked') {
                        return (
                          <Table.Td key={day.date} p={2}>
                            <UnstyledButton
                              w="100%"
                              p={4}
                              style={{
                                background: 'var(--mantine-color-blue-light)',
                                borderRadius: 4,
                              }}
                              disabled={!appointment || !canManage}
                              onClick={() =>
                                appointment &&
                                void navigate(`/emr/appointments/${appointment.id}/cancel`)
                              }
                            >
                              <Text size="xs" fw={600} lineClamp={1}>
                                {appointment?.patientName ?? 'Booked'}
                              </Text>
                              {appointment?.reason && (
                                <Text size="xs" c="dimmed" lineClamp={1}>
                                  {appointment.reason}
                                </Text>
                              )}
                            </UnstyledButton>
                          </Table.Td>
                        )
                      }
                      return (
                        <Table.Td key={day.date} p={2}>
                          {canBook ? (
                            <UnstyledButton
                              w="100%"
                              p={4}
                              ta="center"
                              c="teal"
                              fz="xs"
                              style={{
                                border: '1px dashed var(--mantine-color-teal-4)',
                                borderRadius: 4,
                              }}
                              onClick={() =>
                                void navigate(
                                  `/emr/appointments/new?practitionerId=${providerId}&start=${encodeURIComponent(slot.start)}`,
                                )
                              }
                            >
                              Free
                            </UnstyledButton>
                          ) : (
                            <Text size="xs" c="teal" ta="center">
                              Free
                            </Text>
                          )}
                        </Table.Td>
                      )
                    })}
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>
      </QueryState>
    </Box>
  )
}
