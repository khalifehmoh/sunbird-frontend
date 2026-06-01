import type { BranchType, BranchStatus } from '../../../redux/features/branches/branchesTypes'

export const BRANCH_TYPE_OPTIONS: { value: BranchType; label: string }[] = [
  { value: 'MAIN', label: 'Main' },
  { value: 'REGIONAL', label: 'Regional' },
  { value: 'SATELLITE', label: 'Satellite' },
]

export const BRANCH_STATUS_OPTIONS: { value: BranchStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
]

export const BRANCH_STATUS_COLORS: Record<BranchStatus, string> = {
  ACTIVE: 'teal',
  INACTIVE: 'gray',
}

export const SAUDI_REGION_OPTIONS: { value: string; label: string }[] = [
  { value: 'RIYADH', label: 'Riyadh' },
  { value: 'MAKKAH', label: 'Makkah' },
  { value: 'MADINAH', label: 'Madinah' },
  { value: 'EASTERN', label: 'Eastern Province' },
  { value: 'ASIR', label: 'Asir' },
  { value: 'TABUK', label: 'Tabuk' },
  { value: 'HAIL', label: 'Hail' },
  { value: 'NORTHERN_BORDERS', label: 'Northern Borders' },
  { value: 'JAZAN', label: 'Jazan' },
  { value: 'NAJRAN', label: 'Najran' },
  { value: 'AL_BAHA', label: 'Al Baha' },
  { value: 'AL_JOUF', label: 'Al Jouf' },
  { value: 'QASSIM', label: 'Qassim' },
]
