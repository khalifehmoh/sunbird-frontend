import { Image, useComputedColorScheme } from '@mantine/core'
import { Link } from 'react-router-dom'

export interface BrandLogoProps {
  /** Destination when the logo is clicked. Omit to render a non-link mark. */
  to?: string
  /** Visual size preset */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Force light or dark logo asset. Defaults to current color scheme. */
  variant?: 'auto' | 'light' | 'dark'
  alt?: string
}

const heights: Record<NonNullable<BrandLogoProps['size']>, number> = {
  sm: 28,
  md: 36,
  lg: 56,
  xl: 72,
}

export function BrandLogo({
  to,
  size = 'sm',
  variant = 'auto',
  alt = 'Sunbird',
}: BrandLogoProps) {
  const colorScheme = useComputedColorScheme('light')
  const useDarkAsset =
    variant === 'dark' || (variant === 'auto' && colorScheme === 'dark')

  const src = useDarkAsset
    ? '/sunbird-logo-dark.png'
    : '/sunbird-logo.png'

  const image = (
    <Image
      src={src}
      alt={alt}
      h={heights[size]}
      w="auto"
      fit="contain"
      style={{ display: 'block' }}
    />
  )

  if (!to) {
    return image
  }

  return (
    <Link
      to={to}
      aria-label={alt}
      style={{ display: 'inline-flex', alignItems: 'center', lineHeight: 0 }}
    >
      {image}
    </Link>
  )
}
