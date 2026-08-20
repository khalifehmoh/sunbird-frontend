import { Badge, Combobox, Input, InputBase, useCombobox } from '@mantine/core'
import type { PermissionOperation } from '../../../redux/features/modules/modulesTypes'
import { OPERATION_COLORS, PERMISSION_OPERATIONS } from './permissionConstants'

interface OperationSelectProps {
  label?: string
  value: PermissionOperation | ''
  onChange: (value: PermissionOperation | '') => void
  includeAll?: boolean
  required?: boolean
  w?: number | string
}

export function OperationBadge({
  operation,
  size = 'sm',
}: {
  operation: string
  size?: 'xs' | 'sm' | 'md'
}) {
  return (
    <Badge
      variant="light"
      color={OPERATION_COLORS[operation] ?? 'neutral'}
      size={size}
      tt="uppercase"
    >
      {operation}
    </Badge>
  )
}

export function OperationSelect({
  label = 'Operation',
  value,
  onChange,
  includeAll = false,
  required,
  w,
}: OperationSelectProps) {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  })

  return (
    <Input.Wrapper label={label} required={required} w={w}>
      <Combobox
        store={combobox}
        withinPortal
        onOptionSubmit={(next) => {
          onChange(next as PermissionOperation | '')
          combobox.closeDropdown()
        }}
      >
        <Combobox.Target>
          <InputBase
            component="button"
            type="button"
            pointer
            rightSection={<Combobox.Chevron />}
            rightSectionPointerEvents="none"
            onClick={() => combobox.toggleDropdown()}
            multiline
          >
            {value ? (
              <OperationBadge operation={value} />
            ) : (
              <Input.Placeholder>
                {includeAll ? 'All operations' : 'Select operation'}
              </Input.Placeholder>
            )}
          </InputBase>
        </Combobox.Target>

        <Combobox.Dropdown>
          <Combobox.Options>
            {includeAll ? (
              <Combobox.Option value="">All operations</Combobox.Option>
            ) : null}
            {PERMISSION_OPERATIONS.map((operation) => (
              <Combobox.Option value={operation.value} key={operation.value}>
                <OperationBadge operation={operation.value} />
              </Combobox.Option>
            ))}
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>
    </Input.Wrapper>
  )
}
