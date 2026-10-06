import { useMemo, useState } from 'react'
import { Select } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import {
  useGetWorklistQuery,
  type WorklistItem,
} from '../../../redux/features/emr/emrApi'

type PatientPickerProps = {
  value: string | null
  onChange: (id: string | null, patient: WorklistItem | null) => void
  label?: string
  required?: boolean
  disabled?: boolean
  error?: string
  /** Shown when `value` is set but not in the loaded results (deep links). */
  fallbackLabel?: string
}

/** Searches the patient worklist by name, MRN or mobile. */
export function PatientPicker({
  value,
  onChange,
  label = 'Patient',
  required,
  disabled,
  error,
  fallbackLabel,
}: PatientPickerProps) {
  const [search, setSearch] = useState('')
  const [debounced] = useDebouncedValue(search.trim(), 300)
  const { data, isFetching } = useGetWorklistQuery({
    q: debounced || undefined,
    limit: 20,
  })

  const items = useMemo(() => data?.items ?? [], [data])
  const options = useMemo(() => {
    const list = items.map((patient) => ({
      value: patient.id,
      label: `${patient.name}${patient.mrn ? ` · ${patient.mrn}` : ''}`,
    }))
    if (value && !list.some((option) => option.value === value)) {
      list.unshift({ value, label: fallbackLabel ?? value })
    }
    return list
  }, [items, value, fallbackLabel])

  return (
    <Select
      label={label}
      placeholder="Search by name, MRN or mobile"
      searchable
      clearable
      required={required}
      disabled={disabled}
      error={error}
      data={options}
      value={value}
      searchValue={search}
      onSearchChange={setSearch}
      // The server already filtered; do not filter the labels a second time.
      filter={({ options: all }) => all}
      nothingFoundMessage={isFetching ? 'Searching…' : 'No patients found'}
      onChange={(id) =>
        onChange(id, items.find((patient) => patient.id === id) ?? null)
      }
    />
  )
}
