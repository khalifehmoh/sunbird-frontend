import type { PagedQuery, PagedResponse } from '../../../lib/paging'

export interface AuditEvent {
  auditId: string
  createdAt: string
  userId: string | null
  username: string | null
  userFullName: string | null
  actionType: string
  entityType: string
  entityId: string | null
  entityName: string | null
  tenantId: string | null
  tenantName: string | null
  ipAddress: string | null
  userAgent: string | null
  success: boolean
  errorMessage: string | null
  oldValue: Record<string, unknown> | null
  newValue: Record<string, unknown> | null
  failedLoginAttempts: number | null
  accountLockedUntil: string | null
  targetUserStatus: string | null
}

export interface GetAuditArgs extends PagedQuery {
  from?: string
  to?: string
  userId?: string
  actionType?: string
  entityType?: string
  tenantId?: string
  ip?: string
}

export interface FailedLoginSummary {
  totalFailed: number
  uniqueIps: number
  lockedAccounts: number
  flaggedIps: string[]
}

export type AuditEventsResponse = PagedResponse<AuditEvent>
