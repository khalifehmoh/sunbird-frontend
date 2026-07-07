export interface SessionProfile {
  username: string
  email: string
  role: string
  tenantId: string | null
  requirePasswordChange: boolean
  mfaEnabled: boolean
}

export type AuthState = SessionProfile & {
  isAuthenticated: boolean
}

export type SetUserPayload = Pick<SessionProfile, 'username' | 'email' | 'role'> &
  Partial<Pick<SessionProfile, 'tenantId' | 'requirePasswordChange' | 'mfaEnabled'>>
