import type { GroupStatus } from '../../../redux/features/groups/groupsTypes'

export const GROUP_STATUS_OPTIONS: { value: GroupStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
]

export const GROUP_STATUS_COLORS = {
  ACTIVE: 'teal',
  INACTIVE: 'gray',
  SUSPENDED: 'orange',
} as const
