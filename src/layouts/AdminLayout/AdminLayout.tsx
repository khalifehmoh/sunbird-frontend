import { Link, Outlet } from 'react-router-dom'
import {
  Anchor,
  AppShell,
  Badge,
  Group,
  ScrollArea,
  Text,
  Title,
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
import { ThemeToggle } from '../../components/ThemeToggle'
import { NavbarLinksGroup } from '../../components/NavbarLinksGroup/NavbarLinksGroup'
import { NavbarUserFooter } from '../../components/NavbarUserFooter/NavbarUserFooter'
import classes from './AdminLayout.module.css'

const navData = [
  { label: 'Dashboard', icon: LayoutDashboard, link: '/admin' },
  { label: 'Tenants', icon: Building2, link: '/admin/tenants' },
  { label: 'Branches', icon: GitBranch, link: '/admin/branches' },
  { label: 'Users', icon: Users, link: '/admin/users' },
  { label: 'Groups', icon: UsersRound, link: '/admin/groups' },
  { label: 'Roles', icon: ShieldCheck, link: '/admin/roles' },
  {
    label: 'Modules & Permissions',
    icon: Layers,
    links: [
      { label: 'Modules', link: '/admin/modules' },
      { label: 'Permissions', link: '/admin/permissions' },
    ],
  },
  {
    label: 'Audit & Security',
    icon: KeyRound,
    links: [
      { label: 'Audit Log', link: '/admin/audit' },
      { label: 'Active Sessions', link: '/admin/sessions' },
      { label: 'Failed Logins', link: '/admin/security/failed-logins' },
    ],
  },
]

export function AdminLayout() {
  const links = navData.map((item) => (
    <NavbarLinksGroup
      key={item.label}
      icon={item.icon}
      label={item.label}
      link={'link' in item ? item.link : undefined}
      links={'links' in item ? item.links : undefined}
    />
  ))

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 260, breakpoint: 'sm' }}
    >
      <AppShell.Header>
        <Group h="100%" justify="space-between" px="md">
          <Group gap="xs">
            <Anchor component={Link} to="/admin" underline="never" c="inherit">
              <Title order={4}>Sunbird</Title>
            </Anchor>
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
