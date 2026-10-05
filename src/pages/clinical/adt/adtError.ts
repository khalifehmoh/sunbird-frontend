/** Extract a readable message from an RTK Query / unknown failure. */
export function adtErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error && 'data' in error) {
    const data = (error as { data?: { message?: string; error?: string } }).data
    if (data?.message) return data.message
    if (data?.error) return data.error
  }
  if (typeof error === 'object' && error && 'error' in error) {
    const message = (error as { error?: string }).error
    if (message) return message
  }
  return 'Request failed'
}
