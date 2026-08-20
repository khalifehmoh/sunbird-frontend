export function parseUserAgent(userAgent: string | null | undefined): string {
  if (!userAgent) return 'Unknown'
  if (/Edg\//.test(userAgent)) return 'Edge'
  if (/Chrome\//.test(userAgent)) return 'Chrome'
  if (/Firefox\//.test(userAgent)) return 'Firefox'
  if (/Safari\//.test(userAgent) && !/Chrome\//.test(userAgent)) return 'Safari'
  return userAgent.slice(0, 40)
}

export function parseOs(userAgent: string | null | undefined): string {
  if (!userAgent) return ''
  if (/Windows/.test(userAgent)) return 'Windows'
  if (/Mac OS X|Macintosh/.test(userAgent)) return 'macOS'
  if (/Android/.test(userAgent)) return 'Android'
  if (/iPhone|iPad/.test(userAgent)) return 'iOS'
  if (/Linux/.test(userAgent)) return 'Linux'
  return ''
}

export function formatUserAgent(userAgent: string | null | undefined): string {
  const browser = parseUserAgent(userAgent)
  const os = parseOs(userAgent)
  if (browser === 'Unknown' && !os) return 'Unknown'
  return os ? `${browser} · ${os}` : browser
}
