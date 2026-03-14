import { Link, Outlet } from 'react-router-dom'
import {
  Anchor,
  AppShell,
  Code,
  Group,
  ScrollArea,
  Title,
} from '@mantine/core'
import {
  BarChart3,
  CalendarDays,
  FileSpreadsheet,
  LayoutDashboard,
  FileText,
  Settings,
  Shield,
} from 'lucide-react'
import { ThemeToggle } from '../../components/ThemeToggle'
import { NavbarLinksGroup } from '../../components/NavbarLinksGroup/NavbarLinksGroup'
import classes from './RootLayout.module.css'

const navData = [
  { label: 'Dashboard', icon: LayoutDashboard, link: '/' },
  {
    label: 'Market news',
    icon: FileText,
    initiallyOpened: true,
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
          <Anchor component={Link} to="/" underline="never" c="inherit">
            <Title order={4}>Sunbird</Title>
          </Anchor>
          <ThemeToggle />
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        <AppShell.Section className={classes.links} component={ScrollArea} grow scrollbars="y">
          <div className={classes.linksInner}>{links}</div>
        </AppShell.Section>
        <AppShell.Section className={classes.footer} p="md">
          <Anchor component={Link} to="/settings" size="sm" c="dimmed">
            Account & settings
          </Anchor>
        </AppShell.Section>
      </AppShell.Navbar>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
