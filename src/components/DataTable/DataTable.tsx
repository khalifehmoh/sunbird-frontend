import React from 'react'
import {
  Box,
  Group,
  Pagination,
  Paper,
  Skeleton,
  Table,
  Text,
} from '@mantine/core'

// ---------------------------------------------------------------------------
// Sub-components (slot markers — they carry children, render nothing on their own)
// ---------------------------------------------------------------------------

function Header({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

function Body({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------

interface DataTableProps {
  /** Show skeleton rows instead of body */
  isLoading: boolean
  /** Show "· Updating…" label next to the count */
  isFetching?: boolean
  /** Total record count reported by the API */
  totalElements: number
  /** Total pages for the Pagination component */
  totalPages: number
  /** Current 1-based page */
  page: number
  onPageChange: (page: number) => void
  /** Number of columns — used for skeleton and empty-state colSpan */
  colSpan: number
  /** Optional min-width for the inner table (px) */
  minWidth?: number
  /** Stripe alternating rows — defaults to true */
  striped?: boolean
  /** Text appended after the count, e.g. "tenant(s)" or "branch(es)" */
  countLabel?: string
  /** Message shown when there are no rows and not loading */
  emptyMessage?: string
  /** DataTable.Header and DataTable.Body children */
  children: React.ReactNode
}

function DataTable({
  isLoading,
  isFetching,
  totalElements,
  totalPages,
  page,
  onPageChange,
  colSpan,
  minWidth = 800,
  striped = true,
  countLabel = 'record(s)',
  emptyMessage = 'No records match your filters.',
  children,
}: DataTableProps) {
  let header: React.ReactNode = null
  let body: React.ReactNode = null

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return
    if (child.type === Header) header = (child.props as { children: React.ReactNode }).children
    if (child.type === Body) body = (child.props as { children: React.ReactNode }).children
  })

  const isEmpty = !isLoading && totalElements === 0

  return (
    <Paper withBorder radius="md">
      <Box
        style={{
          width: '100%',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <Table
          striped={striped}
          highlightOnHover
          verticalSpacing="sm"
          style={{ minWidth }}
        >
          <Table.Thead>
            <Table.Tr>{header}</Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <Table.Tr key={i}>
                  <Table.Td colSpan={colSpan}>
                    <Skeleton height={20} radius="sm" />
                  </Table.Td>
                </Table.Tr>
              ))
            ) : isEmpty ? (
              <Table.Tr>
                <Table.Td colSpan={colSpan}>
                  <Text ta="center" c="dimmed" py="xl">
                    {emptyMessage}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              body
            )}
          </Table.Tbody>
        </Table>
      </Box>

      {!isLoading && totalElements > 0 ? (
        <Group justify="space-between" p="md" pt="xs">
          <Text size="sm" c="dimmed">
            {totalElements} {countLabel}
            {isFetching ? ' · Updating…' : null}
          </Text>
          <Pagination
            total={Math.max(1, totalPages)}
            value={page}
            onChange={onPageChange}
            size="sm"
            siblings={1}
          />
        </Group>
      ) : null}
    </Paper>
  )
}

// Attach sub-components for dot-notation usage
DataTable.Header = Header
DataTable.Body = Body

export { DataTable }
