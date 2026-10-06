import { Badge, Code, Group, Paper, Stack, Table, Text } from '@mantine/core'
import { useGetPatientAuditQuery } from '../../../redux/features/emr/emrApi'
import { QueryState } from '../shared/QueryState'
import { formatDateTime } from '../shared/format'

/** Who changed which field of the patient record, newest first (FHIR `_history`). */
export function PatientAuditView({ patientId }: { patientId: string }) {
  const { data, isLoading, error } = useGetPatientAuditQuery(patientId)
  // The API already returns newest first.
  const versions = data?.versions ?? []

  return (
    <QueryState
      isLoading={isLoading}
      error={error}
      empty={versions.length === 0}
      emptyMessage="No history recorded."
    >
      <Stack gap="sm">
        {versions.map((version) => (
          <Paper key={version.versionId} withBorder radius="md" p="sm">
            <Group justify="space-between" mb={version.changes.length ? 'xs' : 0}>
              <Group gap="xs">
                <Badge color={version.kind === 'created' ? 'teal' : 'blue'} variant="light">
                  {version.kind === 'created' ? 'Created' : 'Updated'}
                </Badge>
                <Text size="sm">{version.author ?? 'Unknown user'}</Text>
              </Group>
              <Text size="xs" c="dimmed">
                {formatDateTime(version.lastUpdated)}
              </Text>
            </Group>
            {version.changes.length > 0 && (
              <Table.ScrollContainer minWidth={480}>
                <Table verticalSpacing={4}>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Field</Table.Th>
                      <Table.Th>Before</Table.Th>
                      <Table.Th>After</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {version.changes.map((change) => (
                      <Table.Tr key={change.path}>
                        <Table.Td>
                          <Code>{change.path}</Code>
                        </Table.Td>
                        <Table.Td c="dimmed">{change.before ?? '—'}</Table.Td>
                        <Table.Td>{change.after ?? '—'}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            )}
          </Paper>
        ))}
      </Stack>
    </QueryState>
  )
}
