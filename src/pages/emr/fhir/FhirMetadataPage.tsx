import { Badge, Box, Code, Container, Group, Paper, Table, Text, Title } from '@mantine/core'
import { useGetCapabilityStatementQuery } from '../../../redux/features/emr/emrApi'
import { QueryState } from '../shared/QueryState'

const INTERACTIONS = ['read', 'vread', 'search-type', 'create', 'update', 'delete', 'history-instance']

/** Page 31: the public FHIR capability statement, resource by operation. */
export function FhirMetadataPage() {
  const { data, isLoading, error } = useGetCapabilityStatementQuery()
  const resources = data?.rest?.find((entry) => entry.mode === 'server')?.resource ?? []

  return (
    <Container size="lg" py="xl">
      <Box mb="md">
        <Title order={2}>FHIR capability statement</Title>
        <Text c="dimmed" size="sm">
          Resources and operations this server supports.
        </Text>
      </Box>
      <QueryState isLoading={isLoading} error={error}>
        {data && (
          <>
            <Group gap="xs" mb="md">
              {data.fhirVersion && <Badge variant="light">FHIR {data.fhirVersion}</Badge>}
              {data.software?.name && (
                <Badge variant="light" color="gray">
                  {data.software.name} {data.software.version ?? ''}
                </Badge>
              )}
              {data.format?.map((format) => (
                <Badge key={format} variant="outline" color="gray">
                  {format}
                </Badge>
              ))}
            </Group>
            <Paper withBorder radius="md" p="md">
              <Table.ScrollContainer minWidth={720}>
                <Table verticalSpacing="xs" highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Resource</Table.Th>
                      {INTERACTIONS.map((name) => (
                        <Table.Th key={name} ta="center">
                          {name}
                        </Table.Th>
                      ))}
                      <Table.Th>Search parameters</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {resources.map((resource) => {
                      const supported = new Set(resource.interaction.map((i) => i.code))
                      return (
                        <Table.Tr key={resource.type}>
                          <Table.Td fw={600}>{resource.type}</Table.Td>
                          {INTERACTIONS.map((name) => (
                            <Table.Td key={name} ta="center">
                              {supported.has(name) ? (
                                <Text span c="teal" fw={700}>
                                  ✓
                                </Text>
                              ) : (
                                <Text span c="dimmed">
                                  –
                                </Text>
                              )}
                            </Table.Td>
                          ))}
                          <Table.Td>
                            <Group gap={4}>
                              {(resource.searchParam ?? []).map((param) => (
                                <Code key={param.name}>{param.name}</Code>
                              ))}
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      )
                    })}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            </Paper>
          </>
        )}
      </QueryState>
    </Container>
  )
}
