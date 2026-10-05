import { isPlatformAdmin, useAuth } from "./useAuth";

export function hasPermission(
  role: string | null | undefined,
  permissions: string[],
  code?: string,
): boolean {
  if (isPlatformAdmin(role)) return true;
  if (!code) return false;
  return permissions.includes(code);
}

export function usePermissions(permission?: string): boolean {
  const { role, permissions } = useAuth();
  return hasPermission(role, permissions, permission);
}

/**
 * True when the user holds every code in `codes`. Platform admins bypass, as in
 * {@link hasPermission}. An empty list means "no requirement".
 */
export function hasAllPermissions(
  role: string | null | undefined,
  permissions: string[],
  codes: readonly string[],
): boolean {
  if (isPlatformAdmin(role)) return true;
  return codes.every((code) => permissions.includes(code));
}

export function useHasPermissions(codes: readonly string[]): boolean {
  const { role, permissions } = useAuth();
  return hasAllPermissions(role, permissions, codes);
}
