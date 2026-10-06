import { useMemo, useState } from 'react'
import { Select } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import {
  useGetWorklistQuery,
  useGetPatientOverviewQuery,
  type WorklistItem,
} from '../../../redux/features/emr/emrApi'

type PatientPickerProps = {
  value: string | null
  onChange: (id: string | null, patient: WorklistItem | null) => void
  label?: string
  required?: boolean
  disabled?: boolean
  error?: string
}

function labelOf(patient: { name: string; mrn: string | null }): string {
  return `${patient.name}${patient.mrn ? ` · ${patient.mrn}` : ''}`
}

/** Searches the patient worklist by name, MRN or mobile. */
export function PatientPicker({
  value,
  onChange,
  label = 'Patient',
  required,
  disabled,
  error,
}: PatientPickerProps) {
  const [search, setSearch] = useState('')
  // The chosen patient is remembered here so its label survives the result
  // list changing underneath it (Mantine writes the label into the search box).
  const [chosen, setChosen] = useState<WorklistItem | null>(null)
  const chosenLabel = chosen && chosen.id === value ? labelOf(chosen) : null
  const searching = search.trim() !== chosenLabel ? search.trim() : ''
  const [debounced] = useDebouncedValue(searching, 300)

  const { data, isFetching } = useGetWorklistQuery({
    q: debounced || undefined,
    limit: 20,
  })

  // A deep link (`?patientId=`) has a value but nothing chosen yet.
  const { data: linked } = useGetPatientOverviewQuery(value ?? '', {
    skip: !value || chosen?.id === value,
  })

  const items = useMemo(() => data?.items ?? [], [data])
  const options = useMemo(() => {
    const list = items.map((patient) => ({
      value: patient.id,
      label: labelOf(patient),
    }))
    if (value && !list.some((option) => option.value === value)) {
      const known = chosenLabel ?? (linked ? labelOf(linked.patient) : null)
      if (known) list.unshift({ value, label: known })
    }
    return list
  }, [items, value, chosenLabel, linked])

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
      onChange={(id) => {
        const patient = items.find((item) => item.id === id) ?? null
        setChosen(patient)
        onChange(id, patient)
      }}
    />
  )
}
