/** Live DB `permission_code` values used by the admin console. */
export const Permission = {
  USER_READ: 'USER_MGMT_READ',
  USER_CREATE: 'USER_MGMT_CREATE',
  USER_UPDATE: 'USER_MGMT_UPDATE',
  USER_DELETE: 'USER_MGMT_DELETE',
  USER_EXPORT: 'USER_MGMT_EXPORT',
  TENANT_READ: 'TENANT:READ',
  BRANCH_READ: 'BRANCH:READ',
  GROUP_READ: 'GROUP:READ',
  ROLE_READ: 'ROLE:READ',
  MODULE_READ: 'MODULE:READ',
  PERMISSION_READ: 'PERMISSION:READ',
  AUDIT_READ: 'AUDIT:READ',
  SESSION_READ: 'SESSION:READ',
} as const

/**
 * Codes that unlock the `/admin` shell and the dashboard link.
 * Excludes clinical/settings codes such as `SETTINGS_READ`.
 */
export const ADMIN_CONSOLE_PERMISSIONS: readonly string[] = [
  Permission.USER_READ,
  Permission.USER_CREATE,
  Permission.USER_UPDATE,
  Permission.USER_DELETE,
  Permission.USER_EXPORT,
  Permission.TENANT_READ,
  Permission.BRANCH_READ,
  Permission.GROUP_READ,
  Permission.ROLE_READ,
  Permission.MODULE_READ,
  Permission.PERMISSION_READ,
  Permission.AUDIT_READ,
  Permission.SESSION_READ,
]
