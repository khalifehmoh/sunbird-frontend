import type { PagedQuery } from '../../../lib/paging'

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'LOCKED' | 'INACTIVE'
export type UserRole = 'ADMIN' | 'USER' | 'MANAGER'

export interface UserListItem {
  userId: string
  username: string
  email: string
  firstName: string | null
  lastName: string | null
  firstNameAr: string | null
  lastNameAr: string | null
  fullName: string | null
  fullNameAr: string | null
  role: UserRole
  status: UserStatus
  mfaEnabled: boolean
  requirePasswordChange: boolean
  lastLoginAt: string | null
  lastLoginIp: string | null
  tenantId: string | null
  tenantName: string | null
  createdAt: string | null
  updatedAt: string | null
  temporaryPassword?: string
}

export interface GetUsersArgs extends PagedQuery {
  status: UserStatus | ''
  tenantId?: string
}

export interface CreateUserRequest {
  userId?: string
  tenantId?: string
  username: string
  email: string
  firstName: string
  lastName: string
  firstNameAr?: string
  lastNameAr?: string
  role?: UserRole
  status?: UserStatus
  mfaEnabled?: boolean
}

export interface UserSessionItem {
  sessionId: string
  loginAt: string | null
  lastActivityAt: string | null
  ipAddress: string | null
  userAgent: string | null
  expiresAt: string | null
  isActive: boolean
  isRevoked: boolean
}

export interface ActiveSessionItem extends UserSessionItem {
  userId: string
  username: string
  fullName: string | null
  tenantId: string | null
  tenantName: string | null
}

export interface GetActiveSessionsArgs {
  page: number
  size: number
  search: string
}

export interface UserRoleItem {
  userRoleId: string | null
  roleId: string
  roleCode: string
  roleName: string
  roleNameAr: string | null
  isSystemRole: boolean
  assignedAt: string | null
  source: 'DIRECT' | 'GROUP'
  groupId: string | null
  groupName: string | null
}

export interface UserGroupItem {
  memberId: string
  groupId: string
  groupCode: string
  groupName: string
  groupNameAr: string | null
  status: string
  joinedAt: string | null
}

export interface EffectivePermissionItem {
  permissionId: string
  permissionCode: string
  permissionName: string
  moduleId: string
  moduleCode: string
  operation: string
  sources: Array<'DIRECT' | 'GROUP'>
}
