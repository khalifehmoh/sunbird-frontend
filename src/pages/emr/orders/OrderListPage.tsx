import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Box,
  Button,
  Group,
  Modal,
  Paper,
  Select,
  Stack,
  Textarea,
} from '@mantine/core'
import { Plus } from 'lucide-react'
import { EmrAccess } from '../../../constants/permissions'
import { useHasPermissions } from '../../../hooks/usePermissions'
import { notify } from '../../../lib/notify'
import {
  useCancelOrderMutation,
  useGetOrdersQuery,
  type OrderPriority,
  type OrderRow,
  type OrderType,
} from '../../../redux/features/emr/emrApi'
import { PageHeader } from '../shared/PageHeader'
import { QueryState } from '../shared/QueryState'
import { errorMessage } from '../shared/format'
import { useNewItemAlerts } from '../shared/useNewItemAlerts'
import { OrdersTable } from '../shared/tables'

const ORDERS_POLL_MS = 15_000

export function OrderListPage() {
  const [params, setParams] = useSearchParams()
  const status = params.get('status')
  const type = params.get('type') as OrderType | null
  const priority = params.get('priority') as OrderPriority | null
  const patientId = params.get('patientId')
  const canCreate = useHasPermissions(EmrAccess.create)
  const canCancel = useHasPermissions(EmrAccess.update)
  const [target, setTarget] = useState<OrderRow | null>(null)
  const [reason, setReason] = useState('')
  const [cancelOrder, { isLoading: cancelling }] = useCancelOrderMutation()

  const { data, isLoading, error } = useGetOrdersQuery({
    patientId: patientId ?? undefined,
    status: status ?? undefined,
    type: type ?? undefined,
    priority: priority ?? undefined,
    limit: 100,
  }, { pollingInterval: ORDERS_POLL_MS })
  const rows = data?.items ?? []

  // Orders also arrive from other systems (HL7 ORM), so say so when one lands.
  useNewItemAlerts(
    data?.items,
    `${patientId}|${status}|${type}|${priority}`,
    (fresh) =>
      notify({
        type: 'info',
        title: fresh.length === 1 ? 'New order' : `${fresh.length} new orders`,
        message: fresh
          .slice(0, 3)
          .map(
            (order) =>
              `${order.orderNumber ?? 'Order'} · ${order.display ?? order.code ?? ''} · ${order.patientName ?? 'Unknown patient'}`,
          )
          .join('\n'),
      }),
  )

  function setFilter(key: string, value: string | null) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  async function confirmCancel() {
    if (!target || !reason.trim()) return
    try {
      await cancelOrder({ id: target.id, reason: reason.trim() }).unwrap()
      notify({
        type: 'success',
        title: 'Order cancelled',
        message: `Order ${target.orderNumber ?? target.id} was cancelled.`,
      })
      setTarget(null)
      setReason('')
    } catch (err) {
      notify({ type: 'error', title: 'Cancel failed', message: errorMessage(err) })
    }
  }

  return (
    <Box p="md">
      <PageHeader
        title="Orders"
        description="Laboratory and radiology orders."
        actions={
          canCreate && (
            <Button component={Link} to="/emr/orders/new" leftSection={<Plus size={16} />}>
              New order
            </Button>
          )
        }
      />
      <Paper withBorder radius="md" p="md" mb="md">
        <Group>
          <Select
            placeholder="Status"
            clearable
            data={['active', 'completed', 'revoked', 'on-hold', 'draft']}
            value={status}
            onChange={(value) => setFilter('status', value)}
          />
          <Select
            placeholder="Type"
            clearable
            data={[
              { value: 'LAB', label: 'Laboratory' },
              { value: 'RAD', label: 'Radiology' },
            ]}
            value={type}
            onChange={(value) => setFilter('type', value)}
          />
          <Select
            placeholder="Priority"
            clearable
            data={['ROUTINE', 'URGENT', 'STAT']}
            value={priority}
            onChange={(value) => setFilter('priority', value)}
          />
          {patientId && (
            <Button variant="subtle" onClick={() => setFilter('patientId', null)}>
              Clear patient filter
            </Button>
          )}
        </Group>
      </Paper>
      <QueryState isLoading={isLoading} error={error} empty={rows.length === 0} emptyMessage="No orders match.">
        <OrdersTable
          rows={rows}
          action={
            canCancel
              ? (row) =>
                  row.status === 'active' || row.status === 'on-hold' ? (
                    <Button size="compact-xs" variant="subtle" color="red" onClick={() => setTarget(row)}>
                      Cancel
                    </Button>
                  ) : null
              : undefined
          }
        />
      </QueryState>

      <Modal
        opened={!!target}
        onClose={() => setTarget(null)}
        title={`Cancel order ${target?.orderNumber ?? ''}`}
      >
        <Stack>
          <Textarea
            label="Reason"
            required
            minRows={2}
            value={reason}
            onChange={(event) => setReason(event.currentTarget.value)}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setTarget(null)}>
              Keep order
            </Button>
            <Button color="red" loading={cancelling} disabled={!reason.trim()} onClick={() => void confirmCancel()}>
              Cancel order
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  )
}
