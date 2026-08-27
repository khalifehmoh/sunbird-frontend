export interface SessionProfile {
  username: string
  email: string
  role: string
  tenantId: string | null
  requirePasswordChange: boolean
  mfaEnabled: boolean
  permissions: string[]
}

export type AuthState = SessionProfile & {
  isAuthenticated: boolean
}

export type SetUserPayload = Pick<SessionProfile, 'username' | 'email' | 'permissions'> &
  Partial<Pick<SessionProfile, 'tenantId' | 'requirePasswordChange' | 'mfaEnabled'>> & {
    role: string | null
  }
