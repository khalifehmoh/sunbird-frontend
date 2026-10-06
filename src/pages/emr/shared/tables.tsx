import type { ReactNode } from 'react'
import { Badge, Table, Text } from '@mantine/core'
import { Link } from 'react-router-dom'
import { StatusBadge } from '../../../components/StatusBadge/StatusBadge'
import type {
  AppointmentRow,
  DiagnosisRow,
  OrderRow,
  ResultRow,
  VitalRow,
} from '../../../redux/features/emr/emrApi'
import {
  APPOINTMENT_STATUS_COLOR,
  FLAG_COLOR,
  ORDER_STATUS_COLOR,
  PRIORITY_COLOR,
  REPORT_STATUS_COLOR,
  formatDateTime,
} from './format'

function Wrap({ children, minWidth = 640 }: { children: ReactNode; minWidth?: number }) {
  return (
    <Table.ScrollContainer minWidth={minWidth}>
      <Table highlightOnHover verticalSpacing="xs">
        {children}
      </Table>
    </Table.ScrollContainer>
  )
}

export function PatientCell({
  id,
  name,
  mrn,
}: {
  id: string | null
  name: string | null
  mrn: string | null
}) {
  if (!id) return <>—</>
  return (
    <>
      <Text component={Link} to={`/emr/patients/${id}`} size="sm" c="blue">
        {name ?? id}
      </Text>
      {mrn && (
        <Text size="xs" c="dimmed">
          {mrn}
        </Text>
      )}
    </>
  )
}

export function OrdersTable({
  rows,
  showPatient = true,
  action,
}: {
  rows: OrderRow[]
  showPatient?: boolean
  action?: (row: OrderRow) => ReactNode
}) {
  return (
    <Wrap>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Order #</Table.Th>
          {showPatient && <Table.Th>Patient</Table.Th>}
          <Table.Th>Test</Table.Th>
          <Table.Th>Type</Table.Th>
          <Table.Th>Priority</Table.Th>
          <Table.Th>Status</Table.Th>
          <Table.Th>Ordered</Table.Th>
          {action && <Table.Th />}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {rows.map((row) => (
          <Table.Tr key={row.id}>
            <Table.Td>{row.orderNumber ?? '—'}</Table.Td>
            {showPatient && (
              <Table.Td>
                <PatientCell id={row.patientId} name={row.patientName} mrn={row.mrn} />
              </Table.Td>
            )}
            <Table.Td>
              {row.display ?? row.code}
              <Text size="xs" c="dimmed">
                {row.code}
              </Text>
            </Table.Td>
            <Table.Td>{row.type ?? '—'}</Table.Td>
            <Table.Td>
              <StatusBadge value={row.priority} colorMap={PRIORITY_COLOR} variant="light" />
            </Table.Td>
            <Table.Td>
              <StatusBadge value={row.status} colorMap={ORDER_STATUS_COLOR} variant="light" />
            </Table.Td>
            <Table.Td>{formatDateTime(row.orderedAt)}</Table.Td>
            {action && <Table.Td>{action(row)}</Table.Td>}
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Wrap>
  )
}

export function ResultsTable({
  rows,
  showPatient = true,
}: {
  rows: ResultRow[]
  showPatient?: boolean
}) {
  return (
    <Wrap>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Report</Table.Th>
          {showPatient && <Table.Th>Patient</Table.Th>}
          <Table.Th>Order #</Table.Th>
          <Table.Th>Status</Table.Th>
          <Table.Th>Issued</Table.Th>
          <Table.Th>Source</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {rows.map((row) => (
          <Table.Tr key={row.id}>
            <Table.Td>
              <Text component={Link} to={`/emr/results/${row.id}`} size="sm" c="blue">
                {row.display ?? row.code ?? 'Report'}
              </Text>
              {row.hasCritical && (
                <Badge color="red" size="xs" ml={6}>
                  Critical
                </Badge>
              )}
            </Table.Td>
            {showPatient && (
              <Table.Td>
                <PatientCell id={row.patientId} name={row.patientName} mrn={row.mrn} />
              </Table.Td>
            )}
            <Table.Td>{row.orderNumber ?? '—'}</Table.Td>
            <Table.Td>
              <StatusBadge value={row.status} colorMap={REPORT_STATUS_COLOR} variant="light" />
            </Table.Td>
            <Table.Td>{formatDateTime(row.issuedAt)}</Table.Td>
            <Table.Td>{row.source}</Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Wrap>
  )
}

export function VitalsTable({ rows }: { rows: VitalRow[] }) {
  return (
    <Wrap minWidth={520}>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Measured</Table.Th>
          <Table.Th>Vital</Table.Th>
          <Table.Th>Value</Table.Th>
          <Table.Th>Flag</Table.Th>
          <Table.Th>Source</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {rows.map((row) => (
          <Table.Tr key={row.id}>
            <Table.Td>{formatDateTime(row.measuredAt)}</Table.Td>
            <Table.Td>{row.display}</Table.Td>
            <Table.Td fw={600} c={row.flag === 'critical' ? 'red' : undefined}>
              {row.value} {row.unit}
            </Table.Td>
            <Table.Td>
              <StatusBadge value={row.flag} colorMap={FLAG_COLOR} variant="light" />
            </Table.Td>
            <Table.Td>{row.source}</Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Wrap>
  )
}

export function DiagnosesTable({ rows }: { rows: DiagnosisRow[] }) {
  return (
    <Wrap minWidth={520}>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Recorded</Table.Th>
          <Table.Th>Type</Table.Th>
          <Table.Th>Code</Table.Th>
          <Table.Th>Diagnosis</Table.Th>
          <Table.Th>Notes</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {rows.map((row) => (
          <Table.Tr key={row.id}>
            <Table.Td>{formatDateTime(row.recordedAt)}</Table.Td>
            <Table.Td>
              <Badge variant="light">{row.type ?? '—'}</Badge>
            </Table.Td>
            <Table.Td>{row.code}</Table.Td>
            <Table.Td>{row.display}</Table.Td>
            <Table.Td>{row.notes ?? '—'}</Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Wrap>
  )
}

export function AppointmentsTable({
  rows,
  showPatient = true,
  action,
}: {
  rows: AppointmentRow[]
  showPatient?: boolean
  action?: (row: AppointmentRow) => ReactNode
}) {
  return (
    <Wrap>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>When</Table.Th>
          {showPatient && <Table.Th>Patient</Table.Th>}
          <Table.Th>Provider</Table.Th>
          <Table.Th>Type</Table.Th>
          <Table.Th>Reason</Table.Th>
          <Table.Th>Status</Table.Th>
          {action && <Table.Th />}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {rows.map((row) => (
          <Table.Tr key={row.id}>
            <Table.Td>{formatDateTime(row.start)}</Table.Td>
            {showPatient && (
              <Table.Td>
                <PatientCell id={row.patientId} name={row.patientName} mrn={row.mrn} />
              </Table.Td>
            )}
            <Table.Td>{row.practitionerName ?? '—'}</Table.Td>
            <Table.Td>{row.type ?? '—'}</Table.Td>
            <Table.Td>{row.reason ?? '—'}</Table.Td>
            <Table.Td>
              <StatusBadge
                value={row.status}
                colorMap={APPOINTMENT_STATUS_COLOR}
                variant="light"
              />
            </Table.Td>
            {action && <Table.Td>{action(row)}</Table.Td>}
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Wrap>
  )
}
