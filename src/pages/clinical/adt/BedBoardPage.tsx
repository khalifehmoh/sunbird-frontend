import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Badge,
  Box,
  Card,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { useGetBedBoardQuery } from '../../../redux/features/adt/adtApi'

export function BedBoardPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useGetBedBoardQuery()

  const wards = useMemo(() => {
    const locations = data?.locations ?? []
    const wardList = locations.filter((l) => l.physicalType === 'wa')
    const rooms = locations.filter((l) => l.physicalType === 'ro')
    const beds = locations.filter((l) => l.physicalType === 'bd')

    return wardList.map((ward) => {
      const wardRooms = rooms.filter((room) => room.partOfId === ward.id)
      const wardBeds = beds.filter((bed) =>
        wardRooms.some((room) => room.id === bed.partOfId),
      )
      return { ward, beds: wardBeds }
    })
  }, [data?.locations])

  if (isLoading) {
    return (
      <Group justify="center" p="xl">
        <Loader />
      </Group>
    )
  }

  return (
    <Box p="xl">
      <Title order={1} mb={4}>
        Bed board
      </Title>
      <Text c="dimmed" size="sm" mb="md">
        Occupancy from FHIR Location.operationalStatus, updated by admit /
        transfer / discharge.
      </Text>

      <Stack gap="lg">
        {wards.map(({ ward, beds }) => (
          <Box key={ward.id}>
            <Group mb="sm">
              <Title order={3}>{ward.name}</Title>
              <Badge variant="light">{ward.code}</Badge>
              <Text size="sm" c="dimmed">
                {beds.filter((b) => b.operationalStatus === 'O').length}/
                {beds.length} occupied
              </Text>
            </Group>
            <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 6 }}>
              {beds.map((bed) => {
                const occupied = bed.operationalStatus === 'O'
                return (
                  <Card
                    key={bed.id}
                    withBorder
                    padding="sm"
                    radius="md"
                    style={{
                      cursor: occupied ? 'pointer' : 'default',
                      borderColor: occupied
                        ? 'var(--mantine-color-red-6)'
                        : 'var(--mantine-color-teal-6)',
                    }}
                    onClick={() => {
                      if (bed.occupiedByEncounterId) {
                        void navigate(
                          `/clinical/encounters/${bed.occupiedByEncounterId}`,
                        )
                      }
                    }}
                  >
                    <Text fw={600} size="sm">
                      {bed.code ?? bed.name}
                    </Text>
                    <Badge
                      mt={6}
                      color={occupied ? 'red' : 'teal'}
                      variant="light"
                    >
                      {occupied ? 'Occupied' : 'Free'}
                    </Badge>
                  </Card>
                )
              })}
            </SimpleGrid>
          </Box>
        ))}
      </Stack>
    </Box>
  )
}
