import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Box,
  Button,
  Group,
  Paper,
  SegmentedControl,
  Select,
  Stack,
  Switch,
  TextInput,
  Textarea,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { notify } from '../../../lib/notify'
import {
  useCreateOrderMutation,
  useGetOrderCatalogQuery,
  type OrderPriority,
  type OrderType,
} from '../../../redux/features/emr/emrApi'
import { PageHeader } from '../shared/PageHeader'
import { PatientPicker } from '../shared/PatientPicker'
import { errorMessage } from '../shared/format'

const LOINC = /^\d{1,7}-\d$/

export function OrderNewPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [patientId, setPatientId] = useState<string | null>(params.get('patientId'))
  const [type, setType] = useState<OrderType>('LAB')
  const [search, setSearch] = useState('')
  const [debounced] = useDebouncedValue(search.trim(), 250)
  const [code, setCode] = useState<string | null>(null)
  const [manual, setManual] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [manualDisplay, setManualDisplay] = useState('')
  const [priority, setPriority] = useState<OrderPriority>('ROUTINE')
  const [notes, setNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [createOrder, { isLoading }] = useCreateOrderMutation()

  const { data: catalog } = useGetOrderCatalogQuery({
    type,
    q: debounced || undefined,
  })
  const options = useMemo(() => {
    const list = (catalog?.items ?? []).map((entry) => ({
      value: entry.code,
      label: `${entry.display} (${entry.code})`,
    }))
    if (code && !list.some((o) => o.value === code)) list.unshift({ value: code, label: code })
    return list
  }, [catalog, code])

  const manualCodeError =
    manual && manualCode && !LOINC.test(manualCode)
      ? 'Enter a LOINC code such as 718-7'
      : undefined

  async function submit() {
    setSubmitted(true)
    const finalCode = manual ? manualCode.trim() : code
    if (!patientId || !finalCode) return
    if (manual && (!LOINC.test(finalCode) || !manualDisplay.trim())) return
    try {
      const order = await createOrder({
        patientId,
        type,
        code: finalCode,
        display: manual ? manualDisplay.trim() : undefined,
        priority,
        notes: notes.trim() || undefined,
      }).unwrap()
      notify({
        type: 'success',
        title: 'Order placed',
        message: `Order ${order.orderNumber ?? order.id} was created.`,
      })
      void navigate(`/emr/orders?patientId=${patientId}`)
    } catch (error) {
      notify({
        type: 'error',
        title: 'Order failed',
        message: errorMessage(error),
      })
    }
  }

  return (
    <Box p="md">
      <PageHeader
        title="New order"
        description="Place a laboratory or radiology order. The order number is assigned on save."
        crumbs={[{ label: 'Orders', to: '/emr/orders' }, { label: 'New' }]}
      />
      <Paper withBorder radius="md" p="lg" maw={720}>
        <Stack>
          <PatientPicker
            required
            value={patientId}
            onChange={(id) => setPatientId(id)}
            error={submitted && !patientId ? 'Select a patient' : undefined}
          />
          <SegmentedControl
            value={type}
            onChange={(value) => {
              setType(value as OrderType)
              setCode(null)
            }}
            data={[
              { value: 'LAB', label: 'Laboratory' },
              { value: 'RAD', label: 'Radiology' },
            ]}
          />
          <Switch
            label="Test is not in the list — enter a LOINC code"
            checked={manual}
            onChange={(event) => setManual(event.currentTarget.checked)}
          />
          {manual ? (
            <Group grow align="flex-start">
              <TextInput
                label="LOINC code"
                required
                placeholder="718-7"
                value={manualCode}
                onChange={(event) => setManualCode(event.currentTarget.value)}
                error={manualCodeError}
              />
              <TextInput
                label="Test name"
                required
                value={manualDisplay}
                onChange={(event) => setManualDisplay(event.currentTarget.value)}
              />
            </Group>
          ) : (
            <Select
              label="Test"
              required
              placeholder="Search the catalogue"
              searchable
              data={options}
              value={code}
              onChange={setCode}
              searchValue={search}
              onSearchChange={setSearch}
              filter={({ options: all }) => all}
              nothingFoundMessage="No matching tests"
              error={submitted && !code ? 'Select a test' : undefined}
            />
          )}
          <Select
            label="Priority"
            allowDeselect={false}
            data={[
              { value: 'ROUTINE', label: 'Routine' },
              { value: 'URGENT', label: 'Urgent' },
              { value: 'STAT', label: 'STAT' },
            ]}
            value={priority}
            onChange={(value) => setPriority((value as OrderPriority) ?? 'ROUTINE')}
          />
          <Textarea
            label="Clinical notes"
            minRows={2}
            value={notes}
            onChange={(event) => setNotes(event.currentTarget.value)}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => void navigate(-1)}>
              Cancel
            </Button>
            <Button loading={isLoading} onClick={() => void submit()}>
              Place order
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Box>
  )
}
