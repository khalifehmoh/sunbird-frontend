import { Outlet, Navigate } from 'react-router-dom'
import type { ComponentType } from 'react'
import {
  AppShell,
  Badge,
  Group,
  ScrollArea,
} from '@mantine/core'
import {
  LayoutDashboard,
  Building2,
  GitBranch,
  Users,
  UsersRound,
  ShieldCheck,
  Layers,
  KeyRound,
} from 'lucide-react'
import { BrandLogo } from '../../components/BrandLogo/BrandLogo'
import { ThemeToggle } from '../../components/ThemeToggle'
import { NavbarLinksGroup } from '../../components/NavbarLinksGroup/NavbarLinksGroup'
import { NavbarUserFooter } from '../../components/NavbarUserFooter/NavbarUserFooter'
import { Permission } from '../../constants/permissions'
import { hasPermission } from '../../hooks/usePermissions'
import { useAuth, useCanAccessAdmin } from '../../hooks/useAuth'
import classes from './AdminLayout.module.css'

type NavLink = {
  label: string
  link: string
  permission?: string
}

type NavItem = {
  label: string
  icon: ComponentType<{ size?: number }>
  link?: string
  permission?: string
  links?: NavLink[]
}

const navData: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, link: '/admin' },
  { label: 'Tenants', icon: Building2, link: '/admin/tenants', permission: Permission.TENANT_READ },
  { label: 'Branches', icon: GitBranch, link: '/admin/branches', permission: Permission.BRANCH_READ },
  { label: 'Users', icon: Users, link: '/admin/users', permission: Permission.USER_READ },
  { label: 'Groups', icon: UsersRound, link: '/admin/groups', permission: Permission.GROUP_READ },
  { label: 'Roles', icon: ShieldCheck, link: '/admin/roles', permission: Permission.ROLE_READ },
  {
    label: 'Modules & Permissions',
    icon: Layers,
    links: [
      { label: 'Modules', link: '/admin/modules', permission: Permission.MODULE_READ },
      { label: 'Permissions', link: '/admin/permissions', permission: Permission.PERMISSION_READ },
    ],
  },
  {
    label: 'Audit & Security',
    icon: KeyRound,
    links: [
      { label: 'Audit Log', link: '/admin/audit', permission: Permission.AUDIT_READ },
      { label: 'Active Sessions', link: '/admin/sessions', permission: Permission.SESSION_READ },
      { label: 'Failed Logins', link: '/admin/security/failed-logins', permission: Permission.AUDIT_READ },
    ],
  },
]

function visibleNav(role: string, permissions: string[]): NavItem[] {
  const allowed = (code?: string) => !code || hasPermission(role, permissions, code)

  return navData.flatMap((item) => {
    if (item.links) {
      const links = item.links.filter((child) => allowed(child.permission))
      if (links.length === 0) return []
      return [{ ...item, links }]
    }
    if (!allowed(item.permission)) return []
    return [item]
  })
}

export function AdminLayout() {
  const canAccess = useCanAccessAdmin()
  const { role, permissions } = useAuth()
  const links = visibleNav(role, permissions).map((item) => (
    <NavbarLinksGroup
      key={item.label}
      icon={item.icon}
      label={item.label}
      link={item.link}
      links={item.links}
    />
  ))

  if (!canAccess) {
    return <Navigate to="/" replace />
  }

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{ width: 260, breakpoint: 'sm' }}
    >
      <AppShell.Header>
        <Group h="100%" justify="space-between" px="md">
          <Group gap="xs">
            <BrandLogo to="/admin" size="lg" />
            <Badge variant="light" color="blue" size="xs" tt="uppercase">
              Admin
            </Badge>
          </Group>
          <ThemeToggle />
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppShell.Section
          className={classes.links}
          component={ScrollArea}
          grow
          scrollbars="y"
        >
          <div className={classes.linksInner}>
            {links}
          </div>
        </AppShell.Section>

        <NavbarUserFooter />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
