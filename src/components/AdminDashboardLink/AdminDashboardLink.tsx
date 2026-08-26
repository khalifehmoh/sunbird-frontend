import { Link } from 'react-router-dom'
import { Button } from '@mantine/core'
import { ArrowLeft, ShieldCog } from 'lucide-react'
import { NavbarLinksGroup } from '../NavbarLinksGroup/NavbarLinksGroup'
import { useIsPlatformAdmin } from '../../hooks/useAuth'

export const ADMIN_DASHBOARD_PATH = '/admin'
export const APP_HOME_PATH = '/'

interface AdminDashboardLinkProps {
  /** `header` is a compact chrome button; `nav` matches sidebar nav items. */
  variant: 'header' | 'nav'
}

/**
 * Entry into `/admin`. Lives in app chrome (header / sidebar) so it survives
 * homepage replacement. Hidden for non-admins.
 */
export function AdminDashboardLink({ variant }: AdminDashboardLinkProps) {
  const isAdmin = useIsPlatformAdmin()
  if (!isAdmin) return null

  if (variant === 'header') {
    return (
      <Button
        component={Link}
        to={ADMIN_DASHBOARD_PATH}
        variant="light"
        size="sm"
        leftSection={<ShieldCog size={16} strokeWidth={1.75} />}
      >
        Admin
      </Button>
    )
  }

  return (
    <NavbarLinksGroup
      icon={ShieldCog}
      label="Admin dashboard"
      link={ADMIN_DASHBOARD_PATH}
    />
  )
}

export function BackToAppButton() {
  return (
    <Button
      component={Link}
      to={APP_HOME_PATH}
      variant="default"
      size="sm"
      leftSection={<ArrowLeft size={16} strokeWidth={1.75} />}
    >
      Back to app
    </Button>
  )
}
