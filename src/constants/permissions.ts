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
 * Live DB `permission_code` values guarding the clinical surface (FHIR gateway
 * and ADT). Mirrors `PATIENT_MGMT_PERMISSIONS` in the NestJS API, which is what
 * actually enforces them; the checks in the UI only decide what to show.
 */
export const ClinicalPermission = {
  READ: 'PATIENT_MGMT_READ',
  CREATE: 'PATIENT_MGMT_CREATE',
  UPDATE: 'PATIENT_MGMT_UPDATE',
  DELETE: 'PATIENT_MGMT_DELETE',
} as const

/**
 * What a clinical screen or action needs, ANDed (the API's
 * `@RequirePermissions` has the same semantics). Every clinical screen reads
 * through the FHIR gateway, so every set includes READ: a user holding only
 * CREATE could submit an admission but not load the patient to admit.
 */
export const ClinicalAccess = {
  /** Patient and encounter lists/details, bed board. */
  view: [ClinicalPermission.READ],
  /** New patient, A01 admit, A04 register, A05 pre-admit. */
  create: [ClinicalPermission.READ, ClinicalPermission.CREATE],
  /** Edit patient, A02 transfer, A03 discharge. */
  update: [ClinicalPermission.READ, ClinicalPermission.UPDATE],
} as const satisfies Record<string, readonly string[]>

/**
 * Live DB `permission_code` values for the EMR modules beyond patient
 * management. Mirrors `EMR_PERMISSIONS` in the NestJS API.
 */
export const EmrPermission = {
  APPOINTMENT_READ: 'APPOINTMENT_MGMT_READ',
  APPOINTMENT_CREATE: 'APPOINTMENT_MGMT_CREATE',
  APPOINTMENT_UPDATE: 'APPOINTMENT_MGMT_UPDATE',
  INTEGRATION_READ: 'IT:READ',
  INTEGRATION_UPDATE: 'IT:UPDATE',
  NOTIFICATION_ADMIN: 'NOTIF:ADMIN',
} as const

/** What each EMR screen or action needs (ANDed, like the API). */
export const EmrAccess = {
  /** Dashboard, worklist, profile, orders, results, vitals, diagnoses, log. */
  view: [ClinicalPermission.READ],
  /** Register patient, place order, record vitals/diagnosis. */
  create: [ClinicalPermission.READ, ClinicalPermission.CREATE],
  /** Cancel order, transfer, discharge. */
  update: [ClinicalPermission.READ, ClinicalPermission.UPDATE],
  appointmentsView: [EmrPermission.APPOINTMENT_READ],
  appointmentsBook: [
    ClinicalPermission.READ,
    EmrPermission.APPOINTMENT_READ,
    EmrPermission.APPOINTMENT_CREATE,
  ],
  appointmentsManage: [
    ClinicalPermission.READ,
    EmrPermission.APPOINTMENT_READ,
    EmrPermission.APPOINTMENT_UPDATE,
  ],
  integrationView: [EmrPermission.INTEGRATION_READ],
  integrationManage: [
    EmrPermission.INTEGRATION_READ,
    EmrPermission.INTEGRATION_UPDATE,
  ],
  notificationAdmin: [EmrPermission.NOTIFICATION_ADMIN],
} as const satisfies Record<string, readonly string[]>

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
