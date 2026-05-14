import { Table, Text } from '@mantine/core'

export interface SortTableHeaderProps {
  label: string
  field: string
  activeField: string | null
  direction: 'asc' | 'desc'
  onSort: (field: string) => void
}

function UnstyledSortTrigger({
  label,
  active,
  direction,
  onClick,
}: {
  label: string
  active: boolean
  direction: 'asc' | 'desc'
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        all: 'unset',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontWeight: 700,
        fontSize: 'var(--mantine-font-size-xs)',
        textTransform: 'uppercase',
        color: 'var(--mantine-color-dimmed)',
      }}
    >
      {label}
      {active ? (
        <Text span size="xs" fw={700}>
          {direction === 'asc' ? '↑' : '↓'}
        </Text>
      ) : null}
    </button>
  )
}

export function SortTableHeader({
  label,
  field,
  activeField,
  direction,
  onSort,
}: SortTableHeaderProps) {
  const active = activeField === field
  return (
    <Table.Th
      style={{
        cursor: 'pointer',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        verticalAlign: 'middle',
      }}
    >
      <UnstyledSortTrigger
        label={label}
        active={active}
        direction={direction}
        onClick={() => onSort(field)}
      />
    </Table.Th>
  )
}
