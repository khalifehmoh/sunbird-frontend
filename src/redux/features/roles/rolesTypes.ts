import type { PagedQuery } from '../../../lib/paging'

export type RoleStatus = 'ACTIVE' | 'INACTIVE'

export type PermissionOperation =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'EXPORT'
  | 'PRINT'
  | 'APPROVE'

export interface RoleListItem {
  roleId: string
  roleCode: string
  roleName: string
  roleNameAr: string | null
  roleDescription: string | null
  isSystemRole: boolean
  status: RoleStatus
  tenantId: string | null
  tenantName: string | null
  permissionCount: number
  userCount: number
  groupCount: number
  createdAt: string | null
  updatedAt: string | null
}

export interface GetRolesArgs extends PagedQuery {
  status: RoleStatus | ''
  isSystem: boolean | ''
}

export interface CreateRoleRequest {
  roleId?: string
  roleCode: string
  roleName: string
  roleNameAr?: string
  roleDescription?: string
  tenantId?: string | null
  status?: RoleStatus
}

export interface RolePermissionItem {
  permissionId: string
  permissionCode: string
  permissionName: string
  moduleId: string
  moduleCode: string
  operation: string
  grantedAt: string | null
}

export interface ModulePermissionItem {
  permissionId: string
  permissionCode: string
  permissionName: string
  permissionNameAr: string | null
  operation: string
}

export interface ModuleItem {
  moduleId: string
  moduleCode: string
  moduleName: string
  moduleNameAr: string | null
  moduleDescription: string | null
  isSystemModule: boolean
  displayOrder: number | null
  status: string
  permissions: ModulePermissionItem[]
}
