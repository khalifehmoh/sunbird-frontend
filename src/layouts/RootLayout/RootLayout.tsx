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
import { useCanAccessAdmin } from '../../hooks/useAuth'
import classes from './RootLayout.module.css'

const navData = [
  { label: 'Dashboard', icon: LayoutDashboard, link: '/' },
  { label: 'Patients', icon: HeartPulse, link: '/clinical/patients' },
  { label: 'Encounters', icon: ClipboardList, link: '/clinical/encounters' },
  {
    label: 'ADT',
    icon: BedDouble,
    initiallyOpened: true,
    links: [
      { label: 'Admit (A01)', link: '/clinical/adt/admit' },
      { label: 'Register (A04)', link: '/clinical/adt/register' },
      { label: 'Transfer (A02)', link: '/clinical/adt/transfer' },
      { label: 'Discharge (A03)', link: '/clinical/adt/discharge' },
      { label: 'Pre-admit (A05)', link: '/clinical/adt/preadmit' },
      { label: 'Bed board', link: '/clinical/adt/beds' },
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

export function RootLayout() {
  const canAccessAdmin = useCanAccessAdmin()
  const links = navData.map((item) => (
    <NavbarLinksGroup
      key={item.label}
      icon={item.icon}
      label={item.label}
      initiallyOpened={'initiallyOpened' in item ? item.initiallyOpened : false}
      link={'link' in item ? item.link : undefined}
      links={'links' in item ? item.links : undefined}
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
