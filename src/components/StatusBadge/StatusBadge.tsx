import { Badge } from '@mantine/core'
import type { BadgeProps, MantineColor } from '@mantine/core'

export type StatusBadgeProps = Omit<BadgeProps, 'color'> & {
  /** Raw key used to resolve color from `colorMap` */
  value: string
  colorMap: Record<string, MantineColor>
  defaultColor?: MantineColor
}

export function StatusBadge({
  value,
  colorMap,
  defaultColor = 'gray',
  children,
  ...badgeProps
}: StatusBadgeProps) {
  const color = colorMap[value] ?? defaultColor
  return (
    <Badge color={color} {...badgeProps}>
      {children ?? value}
    </Badge>
  )
}
