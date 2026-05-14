import { useNavigate } from 'react-router-dom'
import { Card, Group, Skeleton, Stack, Text, ThemeIcon, Title } from '@mantine/core'

export interface StatCardProps {
  label: string
  value: number | undefined
  icon: React.ReactNode
  /** Mantine color key, e.g. "blue", "teal", "violet" */
  color: string
  /** Optional — if provided the card is clickable and navigates here */
  href?: string
  loading?: boolean
}

export function StatCard({ label, value, icon, color, href, loading = false }: StatCardProps) {
  const navigate = useNavigate()

  const accent = `var(--mantine-color-${color}-6)`

  return (
    <Card
      withBorder
      radius="md"
      p="lg"
      styles={{
        root: {
          borderTopWidth: 3,
          borderTopStyle: 'solid',
          borderTopColor: accent,
          ...(href ? { cursor: 'pointer' } : {}),
        },
      }}
      onClick={href ? () => navigate(href) : undefined}
    >
      <Group justify="space-between" wrap="nowrap">
        <Stack gap={4}>
          <Text size="xs" tt="uppercase" fw={700} c="dimmed" lts={1}>
            {label}
          </Text>
          {loading ? (
            <Skeleton height={32} width={80} radius="sm" />
          ) : (
            <Title order={2}>{(value ?? 0).toLocaleString()}</Title>
          )}
        </Stack>
        <ThemeIcon size={52} radius="md" color={color} variant="light">
          {icon}
        </ThemeIcon>
      </Group>
    </Card>
  )
}
