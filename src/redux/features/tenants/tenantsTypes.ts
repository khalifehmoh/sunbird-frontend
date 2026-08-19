import type { PagedQuery, PagedResponse } from '../../../lib/paging'

export type OrganizationType =
  | 'HOSPITAL'
  | 'NETWORK'
  | 'CLINIC'
  | 'LAB'
  | 'PHARMACY'

export type TenantStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING'

/** Matches GET /tenants list payload */
export interface TenantListItem {
  tenantId?: string
  tenantCode: string
  tenantName?: string
  tenantNameAr: string | null
  organizationType: OrganizationType
  licenseNumber: string | null
  status: TenantStatus
  maxUsers: number
  createdAt: string | null
  updatedAt: string | null
}

export interface GetTenantsArgs extends PagedQuery {
  status: TenantStatus | ''
  type: OrganizationType | ''
}

export interface CreateTenantRequest {
  tenantId?: string
  tenantCode: string
  tenantName: string
  tenantNameAr: string
  organizationType: OrganizationType
  licenseNumber: string
  status?: TenantStatus | null
  maxUsers: number
}

export interface TenantConfigItem {
  configKey: string
  configValue: unknown
  isEncrypted: boolean
  updatedAt: string | null
  updatedBy: string | null
}

export interface TenantAuditEvent {
  id: string
  createdAt: string
  username: string | null
  actionType: string
  entityType: string
  entityName: string
  success: boolean
  ipAddress?: string | null
}

export type TenantAuditResponse = Pick<
  PagedResponse<TenantAuditEvent>,
  'content' | 'totalElements'
>
