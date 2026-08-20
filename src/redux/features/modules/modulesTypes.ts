import type { PagedQuery } from '../../../lib/paging'

export type ModuleStatus = 'ACTIVE' | 'INACTIVE'

export type PermissionOperation =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'EXPORT'
  | 'APPROVE'
  | 'PRINT'

export interface ModulePermissionItem {
  permissionId: string
  permissionCode: string
  permissionName: string
  permissionNameAr: string | null
  operation: string
}

export interface ModuleCatalogItem {
  moduleId: string
  moduleCode: string
  moduleName: string
  moduleNameAr: string | null
  moduleDescription: string | null
  isSystemModule: boolean
  displayOrder: number | null
  status: ModuleStatus
  permissions: ModulePermissionItem[]
}

export interface ModuleListItem {
  moduleId: string
  moduleCode: string
  moduleName: string
  moduleNameAr: string | null
  moduleDescription: string | null
  isSystemModule: boolean
  displayOrder: number | null
  status: ModuleStatus
  permissionCount: number
  createdAt: string | null
  updatedAt: string | null
}

export interface GetModulesArgs extends PagedQuery {
  status: ModuleStatus | ''
}

export interface CreateModuleRequest {
  moduleId?: string
  moduleCode: string
  moduleName: string
  moduleNameAr?: string
  moduleDescription?: string
  status?: ModuleStatus
}

export interface PermissionListItem {
  permissionId: string
  permissionCode: string
  permissionName: string
  permissionNameAr: string | null
  operation: PermissionOperation | string
  moduleId: string
  moduleCode: string
  moduleName: string
  moduleNameAr: string | null
  roleCount: number
  createdAt: string | null
  updatedAt: string | null
}

export interface GetPermissionsArgs extends Omit<PagedQuery, 'search'> {
  moduleId: string
  operation: PermissionOperation | ''
}

export interface CreatePermissionRequest {
  permissionId?: string
  permissionCode: string
  moduleId: string
  operation: PermissionOperation
  permissionName: string
  permissionNameAr?: string
}
