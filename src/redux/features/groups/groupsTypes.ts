import type { PagedQuery } from '../../../lib/paging'

export type GroupStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'

export interface GroupListItem {
  groupId: string
  groupCode: string
  groupName: string
  groupNameAr: string | null
  groupDescription: string | null
  status: GroupStatus
  memberCount: number
  roleCount: number
  tenantId: string
  tenantName: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface GetGroupsArgs extends PagedQuery {
  status: GroupStatus | ''
  tenantId?: string
}

export interface CreateGroupRequest {
  groupId?: string
  tenantId: string
  groupCode: string
  groupName: string
  groupNameAr?: string
  groupDescription?: string
  status?: GroupStatus
}

export interface GroupMemberItem {
  memberId: string
  userId: string
  username: string
  email: string
  fullName: string
  joinedAt: string | null
}

export interface GroupRoleItem {
  groupRoleId: string
  roleId: string
  roleCode: string
  roleName: string
  roleNameAr: string | null
  isSystemRole: boolean
  assignedAt: string | null
  inheritedMemberCount: number
}

export interface RoleOption {
  roleId: string
  roleCode: string
  roleName: string
  roleNameAr: string | null
  isSystemRole: boolean
}
