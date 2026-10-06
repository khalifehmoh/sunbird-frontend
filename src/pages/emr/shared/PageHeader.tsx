import type { ReactNode } from 'react'
import { Anchor, Breadcrumbs, Group, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router-dom'

export type Crumb = { label: string; to?: string }

type PageHeaderProps = {
  title: string
  description?: string
  crumbs?: Crumb[]
  actions?: ReactNode
}

export function PageHeader({
  title,
  description,
  crumbs,
  actions,
}: PageHeaderProps) {
  return (
    <Stack gap={4} mb="md">
      {crumbs && crumbs.length > 0 && (
        <Breadcrumbs>
          {crumbs.map((crumb) =>
            crumb.to ? (
              <Anchor key={crumb.label} component={Link} to={crumb.to} size="sm">
                {crumb.label}
              </Anchor>
            ) : (
              <Text key={crumb.label} size="sm" c="dimmed">
                {crumb.label}
              </Text>
            ),
          )}
        </Breadcrumbs>
      )}
      <Group justify="space-between" align="flex-start" wrap="wrap">
        <Stack gap={2}>
          <Title order={2}>{title}</Title>
          {description && (
            <Text c="dimmed" size="sm">
              {description}
            </Text>
          )}
        </Stack>
        {actions && <Group gap="xs">{actions}</Group>}
      </Group>
    </Stack>
  )
}
