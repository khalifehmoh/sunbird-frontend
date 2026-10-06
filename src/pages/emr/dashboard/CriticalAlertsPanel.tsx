import { Badge, Group, Paper, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import type { CriticalAlert } from '../../../redux/features/emr/emrApi'
import { formatDateTime } from '../shared/format'

type Props = {
  alerts: CriticalAlert[]
  /** When set, the panel links to the full critical results page. */
  showAll?: boolean
}

export function CriticalAlertsPanel({ alerts, showAll = true }: Props) {
  return (
    <Paper withBorder radius="md" p="md">
      <Group justify="space-between" mb="sm">
        <Group gap="xs">
          <AlertTriangle size={18} color="var(--mantine-color-red-6)" />
          <Title order={4}>Critical alerts</Title>
          <Badge color={alerts.length ? 'red' : 'gray'} variant="light">
            {alerts.length}
          </Badge>
        </Group>
        {showAll && (
          <Text component={Link} to="/emr/results/critical" size="sm" c="blue">
            View all
          </Text>
        )}
      </Group>
      {alerts.length === 0 ? (
        <Text c="dimmed" size="sm">
          No critical results.
        </Text>
      ) : (
        <Stack gap="xs">
          {alerts.map((alert) => (
            <Paper key={alert.id} withBorder p="xs" radius="sm">
              <Group justify="space-between" wrap="nowrap" align="flex-start">
                <div>
                  <Text fw={600} size="sm">
                    {alert.display ?? alert.code ?? 'Observation'}:{' '}
                    <Text span c="red" fw={700}>
                      {alert.value ?? '—'} {alert.unit ?? ''}
                    </Text>
                  </Text>
                  <Text size="xs" c="dimmed">
                    {alert.patientId ? (
                      <Text
                        span
                        size="xs"
                        component={Link}
                        to={`/emr/patients/${alert.patientId}`}
                        c="blue"
                      >
                        {alert.patientName ?? alert.patientId}
                      </Text>
                    ) : (
                      (alert.patientName ?? 'Unknown patient')
                    )}
                    {alert.mrn ? ` · ${alert.mrn}` : ''}
                    {alert.referenceRange ? ` · ref ${alert.referenceRange}` : ''}
                  </Text>
                </div>
                <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                  {formatDateTime(alert.observedAt)}
                </Text>
              </Group>
            </Paper>
          ))}
        </Stack>
      )}
    </Paper>
  )
}
