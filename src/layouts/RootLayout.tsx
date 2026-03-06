import * as React from 'react'
import { Outlet } from 'react-router-dom'
import { Anchor, AppShell, Group, Title, UnstyledButton } from '@mantine/core'
import { ThemeToggle } from '../components/ThemeToggle'
import { Link } from 'react-router-dom'

export function RootLayout() {
  return (
    <AppShell header={{ height: 56 }}>
      <AppShell.Header>
        <Group h="100%" justify="space-between" px="md">
          <Anchor component={Link} to="/admin/tenants" underline="never" c="inherit">
              <Title order={4}>Sunbird</Title>
          </Anchor>
          <ThemeToggle />
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
