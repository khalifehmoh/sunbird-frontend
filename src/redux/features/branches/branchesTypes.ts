import type { PagedQuery } from '../../../lib/paging'

export type BranchType = 'MAIN' | 'REGIONAL' | 'SATELLITE'

export type BranchStatus = 'ACTIVE' | 'INACTIVE'

export interface BranchListItem {
  branchId?: string
  branchCode: string
  branchName: string
  branchNameAr: string | null
  branchType: BranchType
  isHeadquarters: boolean
  licenseNumber: string | null
  contactEmail: string | null
  contactPhone: string | null
  address: string | null
  city: string | null
  region: string | null
  status: BranchStatus
  tenantId: string
  tenantName: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface GetBranchesArgs extends PagedQuery {
  tenantId?: string
  status: BranchStatus | ''
  type: BranchType | ''
  hqOnly: boolean
}

export interface CreateBranchRequest {
  branchId?: string
  branchCode: string
  branchName: string
  branchNameAr: string
  branchType: BranchType
  isHeadquarters: boolean
  licenseNumber?: string
  contactEmail?: string
  contactPhone?: string
  address?: string
  city?: string
  region?: string
  status?: BranchStatus | null
  tenantId: string
}
