import type { OrganizationType, TenantStatus } from '../../../redux/features/tenants/tenantsTypes'

/** Base org-type options (no empty/all entry). Used in forms and filter selects. */
export const ORG_TYPE_OPTIONS: { value: OrganizationType; label: string }[] = [
  { value: 'HOSPITAL', label: 'Hospital' },
  { value: 'NETWORK', label: 'Network' },
  { value: 'CLINIC', label: 'Clinic' },
  { value: 'LAB', label: 'Lab' },
  { value: 'PHARMACY', label: 'Pharmacy' },
]

/** Base status options (no empty/all entry). Used in forms and filter selects. */
export const TENANT_STATUS_OPTIONS: { value: TenantStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'PENDING', label: 'Pending' },
]

export const TENANT_STATUS_COLORS = {
  ACTIVE: 'teal',
  INACTIVE: 'gray',
  SUSPENDED: 'orange',
  PENDING: 'blue',
}
