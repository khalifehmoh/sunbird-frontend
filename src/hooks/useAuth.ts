import { useAppSelector } from "../redux/store"
import type { AuthState } from "../redux/features/auth/authTypes"
import { ADMIN_CONSOLE_PERMISSIONS } from "../constants/permissions"

export function useAuth(): AuthState {
    return useAppSelector((state) => state.auth);
}

export function roleCodes(role?: string | null): string[] {
  return (role ?? '')
    .split(',')
    .map((code) => code.trim())
    .filter(Boolean)
}

export function isPlatformAdmin(role?: string | null): boolean {
  return roleCodes(role).some(
    (code) => code === 'ADMIN' || code === 'SUPER_ADMIN',
  )
}

export function useIsPlatformAdmin(): boolean {
  const { role } = useAuth()
  return isPlatformAdmin(role)
}

export function canAccessAdmin(
  role?: string | null,
  permissions: string[] = [],
): boolean {
  if (isPlatformAdmin(role)) return true
  return permissions.some((code) => ADMIN_CONSOLE_PERMISSIONS.includes(code))
}

export function useCanAccessAdmin(): boolean {
  const { role, permissions } = useAuth()
  return canAccessAdmin(role, permissions)
}
