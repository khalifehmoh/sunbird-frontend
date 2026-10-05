import { Box, Button, Text, Title } from '@mantine/core'
import { Link, Outlet } from 'react-router-dom'
import { useHasPermissions } from '../hooks/usePermissions'

/**
 * Layout route that renders its children only when the user holds every code
 * in `codes`; otherwise it explains why the page is not available.
 *
 * Deliberately not a silent redirect: someone who followed a bookmarked link
 * to Discharge should learn they lack access, not wonder why they landed on
 * the dashboard. The API answers 403 for the same codes, so this is a courtesy,
 * not the security boundary.
 */
export function RequirePermissions({ codes }: { codes: readonly string[] }) {
  const allowed = useHasPermissions(codes)

  if (allowed) return <Outlet />

  return (
    <Box p="xl">
      <Title order={2} mb="xs">
        You do not have access to this page
      </Title>
      <Text c="dimmed" mb="md">
        Your account is missing a permission this screen needs. Ask an
        administrator to grant it if you should be able to use it.
      </Text>
      <Button component={Link} to="/" variant="light">
        Back to dashboard
      </Button>
    </Box>
  )
}
