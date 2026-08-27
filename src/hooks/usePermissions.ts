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
