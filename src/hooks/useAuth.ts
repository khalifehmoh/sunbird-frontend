import { useAppSelector } from "../redux/store"
import type { AuthState } from "../redux/features/auth/authTypes"

export function useAuth(): AuthState {
    return useAppSelector((state) => state.auth);
}