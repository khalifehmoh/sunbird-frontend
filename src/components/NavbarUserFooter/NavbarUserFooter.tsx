import { Link, useNavigate } from 'react-router-dom'
import {
  Anchor,
  AppShell,
  Avatar,
  Group,
  Text,
  UnstyledButton,
} from '@mantine/core'
import { LogOut, Settings } from 'lucide-react'
import { useAppSelector } from '../../redux/store'
import { useLogoutUserMutation } from '../../redux/features/auth/authService'
import classes from './NavbarUserFooter.module.css'

export interface NavbarUserFooterProps {
  /** Where "Account & settings" navigates — default `/settings` */
  settingsHref?: string
}

export function NavbarUserFooter({ settingsHref = '/settings' }: NavbarUserFooterProps) {
  const navigate = useNavigate()
  const [logoutUser] = useLogoutUserMutation()
  const username = useAppSelector((s) => s.auth.username)
  const email = useAppSelector((s) => s.auth.email)

  const handleLogout = async () => {
    await logoutUser()
    navigate('/auth/login', { replace: true })
  }

  const u = username?.trim()
  const em = email?.trim()

  const initials = u
    ? u.slice(0, 2).toUpperCase()
    : em
      ? em.slice(0, 2).toUpperCase()
      : '?'

  const primaryLabel = u ?? em ?? 'Account'
  const showEmailSubtitle = Boolean(u && em)

  return (
    <AppShell.Section className={classes.section} p="md">
      <Group gap="sm" mb="xs">
        <Avatar size={32} color="blue" radius="xl">
          {initials}
        </Avatar>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text size="sm" fw={500} truncate>
            {primaryLabel}
          </Text>
          {showEmailSubtitle && (
            <Text size="xs" c="dimmed" truncate>
              {em}
            </Text>
          )}
        </div>
      </Group>

      {/* <Anchor
        component={Link}
        to={settingsHref}
        underline="never"
        display="block"
        mb="sm"
      >
        <Group gap="xs">
          <Settings size={16} strokeWidth={1.75} />
          <Text size="sm">
            Account & settings
          </Text>
        </Group>
      </Anchor> */}

      <UnstyledButton onClick={handleLogout} w="100%">
        <Group gap="xs">
          <LogOut size={16} />
          <Text size="sm">Logout</Text>
        </Group>
      </UnstyledButton>
    </AppShell.Section>
  )
}
