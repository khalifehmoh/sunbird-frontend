import { useAppSelector } from "../redux/store"
import type { AuthState } from "../redux/features/auth/authTypes"

export function useAuth(): AuthState {
    return useAppSelector((state) => state.auth);
}

export function isPlatformAdmin(role?: string | null): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
}

export function useIsPlatformAdmin(): boolean {
  const { role } = useAuth()
  return isPlatformAdmin(role)
}
