import type { RoleStatus } from '../../../redux/features/roles/rolesTypes'

export const ROLE_STATUS_OPTIONS: { value: RoleStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
]

export const ROLE_STATUS_COLORS = {
  ACTIVE: 'teal',
  INACTIVE: 'gray',
} as const

export const MATRIX_OPERATIONS = [
  'CREATE',
  'READ',
  'UPDATE',
  'DELETE',
  'EXPORT',
  'APPROVE',
] as const

export function isRoleLocked(
  role: { isSystemRole: boolean; tenantId: string | null },
  isSuperAdmin: boolean,
): boolean {
  return role.isSystemRole || (!isSuperAdmin && !role.tenantId)
}

export function roleLockReason(
  role: { isSystemRole: boolean; tenantId: string | null },
): string {
  if (role.isSystemRole) return 'System role — cannot be modified or deleted.'
  if (!role.tenantId) return 'Global role — managed by platform administrators.'
  return ''
}
