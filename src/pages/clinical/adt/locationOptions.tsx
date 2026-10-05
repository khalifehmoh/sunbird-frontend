import { useMemo } from 'react'
import { Select } from '@mantine/core'
import { useGetBedBoardQuery, type LocationNode } from '../../../redux/features/adt/adtApi'

function labelFor(node: LocationNode) {
  const code = node.code?.includes(':')
    ? node.code.slice(node.code.indexOf(':') + 1)
    : node.code
  return code ? `${code} — ${node.name}` : node.name
}

export function useLocationOptions() {
  const { data, isLoading } = useGetBedBoardQuery()
  const locations = data?.locations ?? []

  return useMemo(() => {
    const wards = locations.filter((l) => l.physicalType === 'wa')
    const clinics = locations.filter(
      (l) => l.physicalType === 'wi' || l.code?.startsWith('CLINIC') || l.code === 'ED',
    )
    const beds = locations.filter((l) => l.physicalType === 'bd')
    const freeBeds = beds.filter((l) => l.operationalStatus !== 'O')

    return {
      isLoading,
      wards: wards.map((l) => ({ value: l.id, label: labelFor(l) })),
      clinics: clinics.map((l) => ({ value: l.id, label: labelFor(l) })),
      beds: beds.map((l) => ({
        value: l.id,
        label: `${labelFor(l)}${l.operationalStatus === 'O' ? ' (occupied)' : ''}`,
        disabled: l.operationalStatus === 'O',
      })),
      freeBeds: freeBeds.map((l) => ({ value: l.id, label: labelFor(l) })),
      byId: new Map(locations.map((l) => [l.id, l])),
    }
  }, [isLoading, locations])
}

type LocationSelectProps = {
  label: string
  placeholder?: string
  value: string | null
  onChange: (value: string | null) => void
  options: { value: string; label: string; disabled?: boolean }[]
  required?: boolean
  disabled?: boolean
}

export function LocationSelect({
  label,
  placeholder,
  value,
  onChange,
  options,
  required,
  disabled,
}: LocationSelectProps) {
  return (
    <Select
      label={label}
      placeholder={placeholder}
      data={options}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      searchable
      clearable
      nothingFoundMessage="No locations"
    />
  )
}
