import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Collapse,
  Group,
  Text,
  ThemeIcon,
  UnstyledButton,
} from '@mantine/core'
import { ChevronRight } from 'lucide-react'
import classes from './NavbarLinksGroup.module.css'

export interface NavbarLinkItem {
  label: string
  link: string
}

interface NavbarLinksGroupProps {
  icon: React.ComponentType<{ size?: number }>
  label: string
  initiallyOpened?: boolean
  link?: string
  links?: NavbarLinkItem[]
}

export function NavbarLinksGroup({
  icon: Icon,
  label,
  initiallyOpened = false,
  link,
  links,
}: NavbarLinksGroupProps) {
  const location = useLocation()
  const hasLinks = Array.isArray(links) && links.length > 0
  const isLink = typeof link === 'string'
  const [opened, setOpened] = useState(initiallyOpened)

  const content = hasLinks ? (
    links.map((item) => (
      <Link
        to={item.link}
        key={item.label}
        className={classes.link}
        data-active={location.pathname === item.link ? true : undefined}
        onClick={(e) => e.currentTarget.focus()}
      >
        {item.label}
      </Link>
    ))
  ) : null

  if (isLink && !hasLinks) {
    const active = location.pathname === link
    return (
      <Link
        to={link}
        className={classes.control}
        style={{
          textDecoration: 'none',
          color: 'inherit',
          ...(active ? { backgroundColor: 'var(--mantine-color-light)' } : {}),
        }}
      >
        <Group gap="xs">
          <ThemeIcon size={22} variant="light">
            <Icon size={18} />
          </ThemeIcon>
          <Text size="sm" fw={500}>
            {label}
          </Text>
        </Group>
      </Link>
    )
  }

  return (
    <>
      <UnstyledButton
        onClick={() => setOpened((o) => !o)}
        className={classes.control}
      >
        <Group justify="space-between" gap={0}>
          <Group gap="xs">
            <ThemeIcon size={22} variant="light">
              <Icon size={18} />
            </ThemeIcon>
            <Text size="sm" fw={500}>
              {label}
            </Text>
          </Group>
          {hasLinks && (
            <ChevronRight
              className={classes.chevron}
              size={18}
              style={{
                transform: opened ? 'rotate(90deg)' : 'none',
              }}
            />
          )}
        </Group>
      </UnstyledButton>
      {hasLinks ? <Collapse in={opened}>{content}</Collapse> : null}
    </>
  )
}
