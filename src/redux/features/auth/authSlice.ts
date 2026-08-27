import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AuthState, SetUserPayload } from './authTypes'

const initialState: AuthState = {
  isAuthenticated: false,
  username: '',
  email: '',
  role: '',
  tenantId: null,
  requirePasswordChange: false,
  mfaEnabled: false,
  permissions: [],
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<SetUserPayload>) => {
      const { username, email, role, tenantId, requirePasswordChange, mfaEnabled, permissions } = action.payload
      state.isAuthenticated = true
      state.username = username
      state.email = email
      state.role = role ?? ''
      state.tenantId = tenantId ?? null
      state.requirePasswordChange = requirePasswordChange ?? false
      state.mfaEnabled = mfaEnabled ?? false
      state.permissions = permissions ?? []
    },
    logout: () => initialState,
  },
})

export default authSlice.reducer

export const { setUser, logout } = authSlice.actions
