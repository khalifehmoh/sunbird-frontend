export const AUDIT_ACTION_OPTIONS = [
  { value: '', label: 'All actions' },
  { value: 'LOGIN', label: 'LOGIN' },
  { value: 'LOGOUT', label: 'LOGOUT' },
  { value: 'FAILED_LOGIN', label: 'FAILED_LOGIN' },
  { value: 'CREATE', label: 'CREATE' },
  { value: 'UPDATE', label: 'UPDATE' },
  { value: 'DELETE', label: 'DELETE' },
  { value: 'ASSIGN_ROLE', label: 'ASSIGN_ROLE' },
  { value: 'REVOKE_ROLE', label: 'REVOKE_ROLE' },
  { value: 'GRANT_PERMISSION', label: 'GRANT_PERMISSION' },
  { value: 'REVOKE_PERMISSION', label: 'REVOKE_PERMISSION' },
  { value: 'ACTIVATE', label: 'ACTIVATE' },
  { value: 'DEACTIVATE', label: 'DEACTIVATE' },
  { value: 'LOCK', label: 'LOCK' },
  { value: 'UNLOCK', label: 'UNLOCK' },
] as const

export const AUDIT_ENTITY_OPTIONS = [
  { value: '', label: 'All entities' },
  { value: 'TENANT', label: 'TENANT' },
  { value: 'BRANCH', label: 'BRANCH' },
  { value: 'USER', label: 'USER' },
  { value: 'GROUP', label: 'GROUP' },
  { value: 'ROLE', label: 'ROLE' },
  { value: 'PERMISSION', label: 'PERMISSION' },
  { value: 'MODULE', label: 'MODULE' },
  { value: 'CONFIG', label: 'CONFIG' },
] as const

export const AUDIT_ACTION_COLORS: Record<string, string> = {
  CREATE: 'teal',
  UPDATE: 'yellow',
  DELETE: 'red',
  LOGIN: 'blue',
  LOGOUT: 'neutral',
  FAILED_LOGIN: 'orange',
  ASSIGN_ROLE: 'violet',
  REVOKE_ROLE: 'pink',
  GRANT_PERMISSION: 'violet',
  REVOKE_PERMISSION: 'pink',
  ACTIVATE: 'green',
  DEACTIVATE: 'gray',
  LOCK: 'red',
  UNLOCK: 'teal',
  READ: 'blue',
}

export function auditActionColor(action: string): string {
  return AUDIT_ACTION_COLORS[action] ?? 'neutral'
}

export function entityPath(
  entityType: string,
  entityId: string | null,
): string | null {
  if (!entityId) return null
  switch (entityType) {
    case 'TENANT':
      return `/admin/tenants/${entityId}`
    case 'USER':
      return `/admin/users/${entityId}`
    case 'GROUP':
      return `/admin/groups/${entityId}`
    case 'ROLE':
      return `/admin/roles/${entityId}/permissions`
    case 'BRANCH':
      return '/admin/branches'
    case 'MODULE':
      return '/admin/modules'
    case 'PERMISSION':
      return '/admin/permissions'
    default:
      return null
  }
}

export function formatDuration(fromIso: string | null): string {
  if (!fromIso) return '—'
  const mins = Math.max(
    0,
    Math.floor((Date.now() - new Date(fromIso).getTime()) / 60_000),
  )
  const hours = Math.floor(mins / 60)
  const rem = mins % 60
  if (hours <= 0) return `${rem}m`
  return `${hours}h ${rem}m`
}

export function formatCountdown(toIso: string | null): string {
  if (!toIso) return '—'
  const mins = Math.floor((new Date(toIso).getTime() - Date.now()) / 60_000)
  if (mins <= 0) return 'Expired'
  const hours = Math.floor(mins / 60)
  const rem = mins % 60
  if (hours <= 0) return `${rem}m left`
  return `${hours}h ${rem}m left`
}

export function isStaleActivity(lastActivityAt: string | null): boolean {
  if (!lastActivityAt) return true
  return Date.now() - new Date(lastActivityAt).getTime() > 25 * 60_000
}
