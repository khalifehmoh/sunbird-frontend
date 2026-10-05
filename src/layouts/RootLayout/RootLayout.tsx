import type { ComponentType } from 'react'
import { Outlet } from 'react-router-dom'
import {
  AppShell,
  Group,
  ScrollArea,
} from '@mantine/core'
import {
  BarChart3,
  BedDouble,
  CalendarDays,
  ClipboardList,
  FileSpreadsheet,
  HeartPulse,
  LayoutDashboard,
  FileText,
  Settings,
  Shield,
} from 'lucide-react'
import { BrandLogo } from '../../components/BrandLogo/BrandLogo'
import { ThemeToggle } from '../../components/ThemeToggle'
import { AdminDashboardLink } from '../../components/AdminDashboardLink/AdminDashboardLink'
import { NavbarLinksGroup } from '../../components/NavbarLinksGroup/NavbarLinksGroup'
import { NavbarUserFooter } from '../../components/NavbarUserFooter/NavbarUserFooter'
import { ClinicalAccess } from '../../constants/permissions'
import { useAuth, useCanAccessAdmin } from '../../hooks/useAuth'
import { hasAllPermissions } from '../../hooks/usePermissions'
import classes from './RootLayout.module.css'

type NavLinkData = {
  label: string
  link: string
  /** Codes the user must hold (all of them); omitted means always shown. */
  requires?: readonly string[]
}

type NavItem = {
  label: string
  icon: ComponentType<{ size?: number }>
  link?: string
  initiallyOpened?: boolean
  requires?: readonly string[]
  links?: NavLinkData[]
}

const navData: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, link: '/' },
  { label: 'Patients', icon: HeartPulse, link: '/clinical/patients', requires: ClinicalAccess.view },
  { label: 'Encounters', icon: ClipboardList, link: '/clinical/encounters', requires: ClinicalAccess.view },
  {
    label: 'ADT',
    icon: BedDouble,
    initiallyOpened: true,
    links: [
      { label: 'Admit (A01)', link: '/clinical/adt/admit', requires: ClinicalAccess.create },
      { label: 'Register (A04)', link: '/clinical/adt/register', requires: ClinicalAccess.create },
      { label: 'Transfer (A02)', link: '/clinical/adt/transfer', requires: ClinicalAccess.update },
      { label: 'Discharge (A03)', link: '/clinical/adt/discharge', requires: ClinicalAccess.update },
      { label: 'Pre-admit (A05)', link: '/clinical/adt/preadmit', requires: ClinicalAccess.create },
      { label: 'Bed board', link: '/clinical/adt/beds', requires: ClinicalAccess.view },
    ],
  },
  {
    label: 'Market news',
    icon: FileText,
    initiallyOpened: false,
    links: [
      { label: 'Overview', link: '/market-news/overview' },
      { label: 'Forecasts', link: '/market-news/forecasts' },
      { label: 'Outlook', link: '/market-news/outlook' },
      { label: 'Real time', link: '/market-news/real-time' },
    ],
  },
  {
    label: 'Releases',
    icon: CalendarDays,
    links: [
      { label: 'Upcoming releases', link: '/releases/upcoming' },
      { label: 'Previous releases', link: '/releases/previous' },
      { label: 'Releases schedule', link: '/releases/schedule' },
    ],
  },
  { label: 'Analytics', icon: BarChart3, link: '/analytics' },
  { label: 'Contracts', icon: FileSpreadsheet, link: '/contracts' },
  { label: 'Settings', icon: Settings, link: '/settings' },
  {
    label: 'Security',
    icon: Shield,
    links: [
      { label: 'Enable 2FA', link: '/security/2fa' },
      { label: 'Change password', link: '/security/password' },
      { label: 'Recovery codes', link: '/security/recovery' },
    ],
  },
]

function visibleNav(role: string, permissions: string[]): NavItem[] {
  const allowed = (requires?: readonly string[]) =>
    !requires || hasAllPermissions(role, permissions, requires)

  return navData.flatMap((item) => {
    if (item.links) {
      const links = item.links.filter((child) => allowed(child.requires))
      if (links.length === 0) return []
      return [{ ...item, links }]
    }
    return allowed(item.requires) ? [item] : []
  })
}

export function RootLayout() {
  const canAccessAdmin = useCanAccessAdmin()
  const { role, permissions } = useAuth()
  const links = visibleNav(role, permissions).map((item) => (
    <NavbarLinksGroup
      key={item.label}
      icon={item.icon}
      label={item.label}
      initiallyOpened={item.initiallyOpened ?? false}
      link={item.link}
      links={item.links}
    />
  ))

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 300, breakpoint: 'sm' }}
    >
      <AppShell.Header>
        <Group h="100%" justify="space-between" px="md">
          <BrandLogo to="/" size="md" />
          <ThemeToggle />
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        <AppShell.Section className={classes.links} component={ScrollArea} grow scrollbars="y">
          <div className={classes.linksInner}>{links}</div>
        </AppShell.Section>
        {canAccessAdmin && (
          <AppShell.Section className={classes.adminNav}>
            <AdminDashboardLink />
          </AppShell.Section>
        )}
        <NavbarUserFooter />
      </AppShell.Navbar>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
