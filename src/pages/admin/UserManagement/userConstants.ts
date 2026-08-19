import type { UserRole, UserStatus } from '../../../redux/features/users/usersTypes'

export const USER_STATUS_OPTIONS: { value: UserStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'LOCKED', label: 'Locked' },
  { value: 'SUSPENDED', label: 'Suspended' },
]

export const USER_STATUS_COLORS = {
  ACTIVE: 'teal',
  INACTIVE: 'gray',
  LOCKED: 'red',
  SUSPENDED: 'orange',
} as const

export const USER_ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'USER', label: 'User' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'ADMIN', label: 'Admin' },
]

export function userDisplayName(user: {
  fullName?: string | null
  firstName?: string | null
  lastName?: string | null
  username: string
}) {
  if (user.fullName?.trim()) return user.fullName.trim()
  const parts = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
  return parts || user.username
}

export function userInitials(user: {
  fullName?: string | null
  firstName?: string | null
  lastName?: string | null
  username: string
}) {
  const name = userDisplayName(user)
  const chunks = name.split(/\s+/).filter(Boolean)
  if (chunks.length >= 2) {
    return `${chunks[0][0]}${chunks[1][0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}
