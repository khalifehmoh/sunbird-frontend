import type { ReactNode } from 'react'
import { Alert, Center, Loader, Text } from '@mantine/core'
import { errorMessage } from './format'

type QueryStateProps = {
  isLoading?: boolean
  error?: unknown
  /** Shown instead of children when loaded and empty. */
  empty?: boolean
  emptyMessage?: string
  children: ReactNode
}

/** Loading, error and empty states shared by every EMR list and detail view. */
export function QueryState({
  isLoading,
  error,
  empty,
  emptyMessage = 'Nothing to show.',
  children,
}: QueryStateProps) {
  if (isLoading) {
    return (
      <Center p="xl">
        <Loader size="sm" />
      </Center>
    )
  }
  if (error) {
    return (
      <Alert color="red" title="Could not load data">
        {errorMessage(error)}
      </Alert>
    )
  }
  if (empty) {
    return (
      <Center p="xl">
        <Text c="dimmed">{emptyMessage}</Text>
      </Center>
    )
  }
  return <>{children}</>
}
