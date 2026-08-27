import { ShieldCheck } from 'lucide-react'
import { NavbarLinksGroup } from '../NavbarLinksGroup/NavbarLinksGroup'
import { useCanAccessAdmin } from '../../hooks/useAuth'

export const ADMIN_DASHBOARD_PATH = '/admin'

/**
 * Entry into `/admin`. Lives in app chrome (sidebar) so it survives
 * homepage replacement. Hidden unless the user is a platform admin
 * or holds an admin-console permission.
 */
export function AdminDashboardLink() {
  const canAccess = useCanAccessAdmin()
  if (!canAccess) return null

  return (
    <NavbarLinksGroup
      icon={ShieldCheck}
      label="Admin dashboard"
      link={ADMIN_DASHBOARD_PATH}
    />
  )
}
