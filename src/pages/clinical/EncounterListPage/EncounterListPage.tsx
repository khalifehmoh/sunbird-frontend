import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Group,
  Menu,
  Paper,
  Text,
  Title,
} from '@mantine/core'
import {
  ArrowLeftRight,
  BedDouble,
  ClipboardPlus,
  DoorOpen,
  LogIn,
  UserPlus,
} from 'lucide-react'
import type { SearchRequest } from '@medplum/core'
import { SearchControl } from '@medplum/react'
import { ClinicalAccess } from '../../../constants/permissions'
import { useHasPermissions } from '../../../hooks/usePermissions'

const ENCOUNTER_SEARCH: SearchRequest = {
  resourceType: 'Encounter',
  fields: ['identifier', 'subject', 'class', 'status', 'period', 'location'],
  sortRules: [{ code: 'date', descending: true }],
  count: 20,
  total: 'accurate',
}

export function EncounterListPage() {
  const navigate = useNavigate()
  const canCreate = useHasPermissions(ClinicalAccess.create)
  const canUpdate = useHasPermissions(ClinicalAccess.update)
  const [search, setSearch] = useState<SearchRequest>(ENCOUNTER_SEARCH)

  return (
    <Box p="xl">
      <Group justify="space-between" align="flex-start" mb="md">
        <div>
          <Title order={1} mb={4}>
            Encounters
          </Title>
          <Text c="dimmed" size="sm">
            FHIR Encounter list — ADT events write here as class/status/location
            changes.
          </Text>
        </div>
        <Group>
          <Button
            variant="light"
            leftSection={<BedDouble size={16} />}
            onClick={() => void navigate('/clinical/adt/beds')}
          >
            Bed board
          </Button>
          {(canCreate || canUpdate) && (
            <Menu shadow="md" width={220}>
              <Menu.Target>
                <Button leftSection={<ClipboardPlus size={16} />}>ADT</Button>
              </Menu.Target>
              <Menu.Dropdown>
                {canCreate && (
                  <>
                    <Menu.Item
                      leftSection={<LogIn size={14} />}
                      onClick={() => void navigate('/clinical/adt/admit')}
                    >
                      A01 Admit inpatient
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<UserPlus size={14} />}
                      onClick={() => void navigate('/clinical/adt/register')}
                    >
                      A04 Register OPD/ED
                    </Menu.Item>
                  </>
                )}
                {canUpdate && (
                  <>
                    <Menu.Item
                      leftSection={<ArrowLeftRight size={14} />}
                      onClick={() => void navigate('/clinical/adt/transfer')}
                    >
                      A02 Transfer
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<DoorOpen size={14} />}
                      onClick={() => void navigate('/clinical/adt/discharge')}
                    >
                      A03 Discharge
                    </Menu.Item>
                  </>
                )}
                {canCreate && (
                  <Menu.Item
                    leftSection={<ClipboardPlus size={14} />}
                    onClick={() => void navigate('/clinical/adt/preadmit')}
                  >
                    A05 Pre-admission
                  </Menu.Item>
                )}
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>
      </Group>

      <Paper withBorder radius="md" p={0}>
        <SearchControl
          search={search}
          onChange={(event) => setSearch(event.definition)}
          onClick={(event) =>
            void navigate(`/clinical/encounters/${event.resource.id}`)
          }
          hideToolbar={false}
          checkboxesEnabled={false}
        />
      </Paper>
    </Box>
  )
}
