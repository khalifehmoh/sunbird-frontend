import * as React from 'react'
import { ActionIcon, useMantineColorScheme, useComputedColorScheme } from '@mantine/core'
import { Sun, Moon } from 'lucide-react'

const iconProps = { size: 18, strokeWidth: 1.5 }

export function ThemeToggle() {
  const { setColorScheme } = useMantineColorScheme()
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true })

  const toggle = () => {
    setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light')
  }

  return (
    <ActionIcon
      variant="default"
      size="lg"
      onClick={toggle}
      aria-label={computedColorScheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {computedColorScheme === 'light' ? <Moon {...iconProps} /> : <Sun {...iconProps} />}
    </ActionIcon>
  )
}
