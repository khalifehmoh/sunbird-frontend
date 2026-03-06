import { createTheme } from '@mantine/core'

export const theme = createTheme({
  primaryColor: 'teal',
  defaultRadius: 'md',
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  headings: {
    fontFamily: 'inherit',
    fontWeight: '600',
  },
  respectReducedMotion: true,
})
