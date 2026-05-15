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

export interface TenantsPageResponse {
  content: TenantListItem[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}

export interface GetTenantsArgs {
  page: number
  size: number
  search: string
  status: TenantStatus | ''
  type: OrganizationType | ''
  sort?: string
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
