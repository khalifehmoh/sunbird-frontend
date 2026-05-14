import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Collapse,
  Group,
  Text,
  ThemeIcon,
  UnstyledButton,
} from '@mantine/core'
import clsx from 'clsx'
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
  /**
   * Passed to NavLink `end` for single-link items only.
   * Omit to treat `/` and `/admin` as exact (so nested routes don’t stay “Dashboard”).
   */
  end?: boolean
}

function isNestedActive(pathname: string, to: string) {
  if (pathname === to) return true
  return pathname.startsWith(`${to}/`)
}

export function NavbarLinksGroup({
  icon: Icon,
  label,
  initiallyOpened = false,
  link,
  links,
  end,
}: NavbarLinksGroupProps) {
  const location = useLocation()
  const pathname = location.pathname
  const hasLinks = Array.isArray(links) && links.length > 0
  const isLink = typeof link === 'string'

  const groupHasActiveChild = useMemo(
    () =>
      Boolean(
        hasLinks &&
          links!.some((item) => isNestedActive(pathname, item.link)),
      ),
    [hasLinks, links, pathname],
  )

  const [opened, setOpened] = useState(initiallyOpened)

  useEffect(() => {
    if (groupHasActiveChild) setOpened(true)
  }, [groupHasActiveChild])

  const inferredEnd =
    end ?? (link === '/' || link === '/admin')

  const content = hasLinks ? (
    links!.map((item) => (
      <NavLink
        key={item.label}
        to={item.link}
        end={false}
        className={({ isActive }) =>
          clsx(classes.link, isActive && classes.linkActive)
        }
      >
        {item.label}
      </NavLink>
    ))
  ) : null

  if (isLink && !hasLinks) {
    return (
      <NavLink
        to={link}
        end={inferredEnd}
        className={({ isActive }) =>
          clsx(classes.control, classes.controlLink, isActive && classes.controlActive)
        }
      >
        <Group gap="xs">
          <ThemeIcon size={22} variant="light">
            <Icon size={18} />
          </ThemeIcon>
          <Text size="sm" fw={500}>
            {label}
          </Text>
        </Group>
      </NavLink>
    )
  }

  return (
    <>
      <UnstyledButton
        onClick={() => setOpened((o) => !o)}
        className={clsx(classes.control, groupHasActiveChild && classes.controlActive)}
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
